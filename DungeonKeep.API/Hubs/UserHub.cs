using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DungeonKeep.API.Hubs;

public sealed class UserHub(IAuthService authService) : Hub
{
    public async Task JoinUserGroup(string token)
    {
        var user = await authService.GetAuthenticatedUserByTokenAsync(token, Context.ConnectionAborted);
        if (user is null)
            throw new HubException("Authentication required.");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{user.Id}");
    }

    public Task LeaveUserGroup(string userId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
}
