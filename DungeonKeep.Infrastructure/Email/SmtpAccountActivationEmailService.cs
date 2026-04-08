using System.Text.Encodings.Web;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.Infrastructure.Email;

public sealed class SmtpAccountActivationEmailService(
    SmtpCampaignInviteEmailOptions options,
    ILogger<SmtpAccountActivationEmailService> logger) : IAccountActivationEmailService
{
    private static readonly HtmlEncoder HtmlEncoder = HtmlEncoder.Default;

    public async Task SendActivationCodeAsync(AccountActivationEmail activationEmail, CancellationToken cancellationToken = default)
    {
        options.Validate();

        var message = BuildMessage(activationEmail);
        var secureSocketOptions = options.GetSecureSocketOptions();

        using var client = new SmtpClient();

        try
        {
            await client.ConnectAsync(options.Host, options.Port, secureSocketOptions, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Failed to connect to SMTP server {Host}:{Port} using {SecureSocketOption} for account activation delivery.",
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
                logger.LogError(
                    exception,
                    "Failed to authenticate to SMTP server {Host}:{Port} as {Username} for account activation delivery.",
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
            logger.LogError(
                exception,
                "Failed to send account activation email through SMTP server {Host}:{Port} to {RecipientEmail}.",
                options.Host,
                options.Port,
                activationEmail.RecipientEmail);
            throw;
        }

        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation(
            "Sent account activation email to {RecipientEmail}.",
            activationEmail.RecipientEmail);
    }

    private MimeMessage BuildMessage(AccountActivationEmail activationEmail)
    {
        var recipientEmail = activationEmail.RecipientEmail.Trim();
        var recipientDisplayName = HtmlEncoder.Encode(activationEmail.RecipientDisplayName);
        var activationCode = HtmlEncoder.Encode(activationEmail.ActivationCode);
        var expiresAt = activationEmail.ExpiresAtUtc.ToLocalTime().ToString("f");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        message.To.Add(MailboxAddress.Parse(recipientEmail));
        message.Subject = "Your DungeonKeep activation code";

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
                      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.8;">DungeonKeep Account Activation</div>
                      <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;font-family:Georgia,'Times New Roman',serif;">Activate your account</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Welcome to DungeonKeep, <strong>{{recipientDisplayName}}</strong>.</p>
                      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5a4637;">Enter this activation code in the sign-in screen to finish setting up your account.</p>
                      <div style="margin:0 0 20px;padding:18px;border:1px solid #e0d3c1;border-radius:16px;background:#fffefb;text-align:center;">
                        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a6a55;font-weight:700;margin-bottom:8px;">Activation code</div>
                        <div style="font-size:34px;letter-spacing:.24em;font-weight:700;color:#7a4c2e;">{{activationCode}}</div>
                      </div>
                      <p style="margin:0;font-size:14px;line-height:1.6;color:#4d3b30;">This code expires at <strong>{{HtmlEncoder.Encode(expiresAt)}}</strong>.</p>
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
        Welcome to DungeonKeep, {activationEmail.RecipientDisplayName}.

        Use this activation code to finish setting up your account:

        {activationEmail.ActivationCode}

        This code expires at {expiresAt}.
        """;

        message.Body = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        }.ToMessageBody();

        return message;
    }
}