using System.Text.Encodings.Web;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace DungeonKeep.Infrastructure.Email;

public sealed class SmtpPasswordResetEmailService(
    SmtpCampaignInviteEmailOptions options,
    ILogger<SmtpPasswordResetEmailService> logger) : IPasswordResetEmailService
{
    private static readonly HtmlEncoder HtmlEncoder = HtmlEncoder.Default;
    private static readonly object SmtpDiagnosticsLock = new();
    private static readonly string SmtpDiagnosticsPath = Path.Combine(AppContext.BaseDirectory, "logs", "smtp-diagnostics.log");

    public async Task SendPasswordResetCodeAsync(PasswordResetEmail passwordResetEmail, CancellationToken cancellationToken = default)
    {
        options.Validate();

        var message = BuildMessage(passwordResetEmail);
        var secureSocketOptions = options.GetSecureSocketOptions();

        using var client = new SmtpClient();

        try
        {
            await client.ConnectAsync(options.Host, options.Port, secureSocketOptions, cancellationToken);
        }
        catch (Exception exception)
        {
            WriteSmtpDiagnostic("connect_failed", passwordResetEmail.RecipientEmail, exception);
            logger.LogError(
                exception,
                "Failed to connect to SMTP server {Host}:{Port} using {SecureSocketOption} for password reset delivery.",
                options.Host,
                options.Port,
                secureSocketOptions);
            throw;
        }

        if (!string.IsNullOrWhiteSpace(options.Username))
        {
            try
            {
                await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
            }
            catch (Exception exception)
            {
                WriteSmtpDiagnostic("authenticate_failed", passwordResetEmail.RecipientEmail, exception);
                logger.LogError(
                    exception,
                    "Failed to authenticate to SMTP server {Host}:{Port} as {Username} for password reset delivery.",
                    options.Host,
                    options.Port,
                    options.Username);
                throw;
            }
        }

        try
        {
            await client.SendAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            WriteSmtpDiagnostic("send_failed", passwordResetEmail.RecipientEmail, exception);
            logger.LogError(
                exception,
                "Failed to send password reset email through SMTP server {Host}:{Port} to {RecipientEmail}.",
                options.Host,
                options.Port,
                passwordResetEmail.RecipientEmail);
            throw;
        }

        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation(
            "Sent password reset email to {RecipientEmail}.",
            passwordResetEmail.RecipientEmail);
        WriteSmtpDiagnostic("send_succeeded", passwordResetEmail.RecipientEmail, null);
    }

    private static void WriteSmtpDiagnostic(string stage, string recipientEmail, Exception? exception)
    {
        try
        {
            var logDirectory = Path.GetDirectoryName(SmtpDiagnosticsPath);
            if (!string.IsNullOrWhiteSpace(logDirectory))
            {
                Directory.CreateDirectory(logDirectory);
            }

            var line = $"[{DateTime.UtcNow:O}] stage={stage}; recipient={recipientEmail}; " +
              (exception is null
                ? "result=ok"
                : $"result=error; errorType={exception.GetType().Name}; errorMessage={exception.Message}");

            lock (SmtpDiagnosticsLock)
            {
                File.AppendAllText(SmtpDiagnosticsPath, line + Environment.NewLine);
            }
        }
        catch
        {
            // Never throw from diagnostics logging.
        }
    }

    private MimeMessage BuildMessage(PasswordResetEmail passwordResetEmail)
    {
        var recipientEmail = passwordResetEmail.RecipientEmail.Trim();
        var recipientDisplayName = HtmlEncoder.Encode(passwordResetEmail.RecipientDisplayName);
        var resetCode = HtmlEncoder.Encode(passwordResetEmail.ResetCode);
        var resetUrl = passwordResetEmail.ResetUrl;
        var expiresAt = passwordResetEmail.ExpiresAtUtc.ToLocalTime().ToString("f");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        message.To.Add(MailboxAddress.Parse(recipientEmail));
        message.Subject = "Your DungeonKeep password reset code";

        if (!string.IsNullOrWhiteSpace(options.ReplyToAddress))
        {
            message.ReplyTo.Add(new MailboxAddress(options.ReplyToName, options.ReplyToAddress));
        }

        var htmlBody = $$"""
        <html>
        <body style="margin:0;padding:0;background:#f7f1e7;font-family:Segoe UI,Arial,sans-serif;color:#2f241c;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fffaf2;border:1px solid #d9c7ad;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px rgba(70,47,25,.12);">
                  <tr>
                    <td style="padding:24px 28px;background:linear-gradient(135deg,#f3dfc1 0%,#d39a52 100%);color:#2a180f;">
                      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.8;">DungeonKeep Password Reset</div>
                      <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;font-family:Georgia,'Times New Roman',serif;">Reset your password</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Hello, <strong>{{recipientDisplayName}}</strong>.</p>
                      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5a4637;">Enter this code in the password reset screen to choose a new password.</p>
                      <p style="margin:0 0 20px;">
                        <a href="{{resetUrl}}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#a95a29;color:#fffaf2;text-decoration:none;font-weight:700;">Open Reset Page</a>
                      </p>
                      <div style="margin:0 0 20px;padding:18px;border:1px solid #e0d3c1;border-radius:16px;background:#fffefb;text-align:center;">
                        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a6a55;font-weight:700;margin-bottom:8px;">Reset code</div>
                        <div style="font-size:34px;letter-spacing:.24em;font-weight:700;color:#7a4c2e;">{{resetCode}}</div>
                      </div>
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#4d3b30;">This code expires at <strong>{{HtmlEncoder.Encode(expiresAt)}}</strong>.</p>
                      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#7b6554;">If you did not request this reset, you can safely ignore this email.</p>
                      <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#7b6554;">If the button does not work, copy and paste this link into your browser:<br><a href="{{resetUrl}}" style="color:#7a4c2e;word-break:break-all;">{{resetUrl}}</a></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;

        var textBody = $"""
        Hello {passwordResetEmail.RecipientDisplayName}.

        Use this code to reset your DungeonKeep password:

        {passwordResetEmail.ResetCode}

        Open the reset page here:
        {resetUrl}

        This code expires at {expiresAt}.

        If you did not request this reset, you can ignore this email.
        """;

        message.Body = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        }.ToMessageBody();

        return message;
    }
}
