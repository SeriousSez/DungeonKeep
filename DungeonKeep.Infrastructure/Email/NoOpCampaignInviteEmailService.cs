using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.Infrastructure.Email;

public sealed class NoOpCampaignInviteEmailService(ILogger<NoOpCampaignInviteEmailService> logger) : ICampaignInviteEmailService
{
    public Task SendInvitationAsync(CampaignInvitationEmail invitation, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Campaign invite email delivery is disabled. Skipping email to {RecipientEmail} for campaign {CampaignId}.",
            invitation.RecipientEmail,
            invitation.CampaignId);

        return Task.CompletedTask;
    }
}