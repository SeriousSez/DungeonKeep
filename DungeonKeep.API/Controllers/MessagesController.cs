using DungeonKeep.API.Hubs;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MessagesController(
    IMessageService messageService,
    IAuthService authService,
    IHubContext<UserHub> userHub) : ControllerBase
{
    [HttpGet("contacts")]
    public async Task<ActionResult<IReadOnlyList<MessageContactDto>>> GetContacts(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var contacts = await messageService.GetContactsAsync(user.Id, cancellationToken);
        return Ok(contacts);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MessageThreadSummaryDto>>> GetThreads(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var threads = await messageService.GetThreadsAsync(user.Id, cancellationToken);
        return Ok(threads);
    }

    [HttpGet("{threadId:guid}")]
    public async Task<ActionResult<MessageThreadDto>> GetThread(Guid threadId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var thread = await messageService.GetThreadAsync(threadId, user.Id, cancellationToken);
        return thread is null ? NotFound() : Ok(thread);
    }

    [HttpPost("{threadId:guid}/messages")]
    public async Task<ActionResult<MessageThreadDto>> SendMessage(
        Guid threadId,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
            return BadRequest("Message body is required.");

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var thread = await messageService.SendMessageAsync(threadId, user.Id, request, cancellationToken);
        if (thread is null) return NotFound();

        await userHub.Clients.Group($"user-{thread.OtherUserId}")
            .SendAsync("NewMessageReceived", new { threadId = thread.Id }, cancellationToken);

        return Ok(thread);
    }

    [HttpPost("{threadId:guid}/read")]
    public async Task<ActionResult> MarkThreadRead(Guid threadId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        await messageService.MarkThreadReadAsync(threadId, user.Id, cancellationToken);
        return NoContent();
    }

    [HttpPost("compose")]
    public async Task<ActionResult<MessageThreadDto>> Compose(
        [FromBody] ComposeMessageRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
            return BadRequest("Message body is required.");

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var thread = await messageService.ComposeAsync(user.Id, request, cancellationToken);

        await userHub.Clients.Group($"user-{thread.OtherUserId}")
            .SendAsync("NewMessageReceived", new { threadId = thread.Id }, cancellationToken);

        return Ok(thread);
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
