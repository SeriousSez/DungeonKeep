using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DungeonKeep.API.Hubs;

public sealed class CampaignHub(IAuthService authService, ICampaignRepository campaignRepository) : Hub
{
    public async Task JoinCampaign(string campaignId, string token)
    {
        if (!Guid.TryParse(campaignId, out var campaignGuid))
        {
            throw new HubException("Campaign id is invalid.");
        }

        var user = await authService.GetAuthenticatedUserByTokenAsync(token, Context.ConnectionAborted);
        if (user is null)
        {
            throw new HubException("Authentication required.");
        }

        var isMember = await campaignRepository.IsActiveMemberAsync(campaignGuid, user.Id, Context.ConnectionAborted);
        if (!isMember)
        {
            throw new HubException("Campaign access denied.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"campaign-{campaignId}");
    }

    public Task LeaveCampaign(string campaignId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, $"campaign-{campaignId}");
}
