using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class NotificationsController(
    INotificationService notificationService,
    IAuthService authService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var notifications = await notificationService.GetForUserAsync(user.Id, cancellationToken);
        return Ok(notifications);
    }

    [HttpPost("{notificationId:guid}/read")]
    public async Task<ActionResult> MarkRead(Guid notificationId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        await notificationService.MarkReadAsync(notificationId, user.Id, cancellationToken);
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        await notificationService.MarkAllReadAsync(user.Id, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{notificationId:guid}")]
    public async Task<ActionResult> Dismiss(Guid notificationId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        await notificationService.DismissAsync(notificationId, user.Id, cancellationToken);
        return NoContent();
    }

    private async Task<AuthenticatedUser?> GetAuthenticatedUserAsync(CancellationToken cancellationToken)
    {
        var authorization = Request.Headers.Authorization.ToString();
        var token = authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization[7..].Trim()
            : string.Empty;

        return await authService.GetAuthenticatedUserByTokenAsync(token, cancellationToken);
    }
}
