using System.Text.Encodings.Web;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.Infrastructure.Email;

public sealed class SmtpCampaignInviteEmailService(
    SmtpCampaignInviteEmailOptions options,
    ILogger<SmtpCampaignInviteEmailService> logger) : ICampaignInviteEmailService
{
    private static readonly HtmlEncoder HtmlEncoder = HtmlEncoder.Default;

    public async Task SendInvitationAsync(CampaignInvitationEmail invitation, CancellationToken cancellationToken = default)
    {
        var message = BuildMessage(invitation);

        using var client = new SmtpClient();

        await client.ConnectAsync(options.Host, options.Port, options.GetSecureSocketOptions(), cancellationToken);

        if (!string.IsNullOrWhiteSpace(options.Username))
        {
            await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation(
            "Sent campaign invite email to {RecipientEmail} for campaign {CampaignId}.",
            invitation.RecipientEmail,
            invitation.CampaignId);
    }

    private MimeMessage BuildMessage(CampaignInvitationEmail invitation)
    {
        var campaignUrl = invitation.CampaignUrl;
        var recipientEmail = invitation.RecipientEmail.Trim();
        var inviterName = HtmlEncoder.Encode(invitation.InviterDisplayName);
        var campaignName = HtmlEncoder.Encode(invitation.CampaignName);
        var callToAction = invitation.RecipientAlreadyHasAccess
            ? "Open your campaign in DungeonKeep"
            : "Sign in or create your DungeonKeep account with this email to accept the invitation";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        message.To.Add(MailboxAddress.Parse(recipientEmail));
        message.Subject = $"{invitation.InviterDisplayName} invited you to {invitation.CampaignName} in DungeonKeep";

        if (!string.IsNullOrWhiteSpace(options.ReplyToAddress))
        {
            message.ReplyTo.Add(new MailboxAddress(options.ReplyToName, options.ReplyToAddress));
        }
        else if (!string.IsNullOrWhiteSpace(invitation.InviterEmail))
        {
            message.ReplyTo.Add(new MailboxAddress(invitation.InviterDisplayName, invitation.InviterEmail));
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
                      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.8;">DungeonKeep Campaign Invitation</div>
                      <h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;font-family:Georgia,'Times New Roman',serif;">{{campaignName}}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="margin:0 0 14px;font-size:16px;line-height:1.6;"><strong>{{inviterName}}</strong> invited you to join the campaign <strong>{{campaignName}}</strong> on DungeonKeep.</p>
                      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5a4637;">{{callToAction}}.</p>
                      <p style="margin:0 0 24px;">
                        <a href="{{campaignUrl}}" style="display:inline-block;padding:13px 20px;border-radius:999px;background:#a95a29;color:#fffaf2;text-decoration:none;font-weight:700;">Open Campaign</a>
                      </p>
                      <div style="padding:14px 16px;border:1px solid #e0d3c1;border-radius:14px;background:#fffefb;">
                        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a6a55;font-weight:700;margin-bottom:6px;">Invite details</div>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#4d3b30;">Use the email address <strong>{{HtmlEncoder.Encode(recipientEmail)}}</strong> in DungeonKeep to access this campaign.</p>
                      </div>
                      <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#7b6554;">If the button does not work, copy and paste this link into your browser:<br><a href="{{campaignUrl}}" style="color:#7a4c2e;word-break:break-all;">{{campaignUrl}}</a></p>
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
        {invitation.InviterDisplayName} invited you to join the campaign {invitation.CampaignName} on DungeonKeep.

        {(invitation.RecipientAlreadyHasAccess
            ? "Open your campaign in DungeonKeep:"
            : "Sign in or create your DungeonKeep account with this email to accept the invitation:")}
        {campaignUrl}

        Use the email address {recipientEmail} in DungeonKeep to access this campaign.
        """;

        message.Body = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        }.ToMessageBody();

        return message;
    }
}