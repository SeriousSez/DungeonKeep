using Microsoft.AspNetCore.SignalR;

namespace DungeonKeep.API.Hubs;

public sealed class CampaignHub : Hub
{
    public Task JoinCampaign(string campaignId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, $"campaign-{campaignId}");

    public Task LeaveCampaign(string campaignId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, $"campaign-{campaignId}");
}
