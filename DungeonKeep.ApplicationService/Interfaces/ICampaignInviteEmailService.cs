using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICampaignInviteEmailService
{
    Task SendInvitationAsync(CampaignInvitationEmail invitation, CancellationToken cancellationToken = default);
}