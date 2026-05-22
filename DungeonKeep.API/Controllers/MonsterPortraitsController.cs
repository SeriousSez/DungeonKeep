using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/monster-portraits")]
public sealed class MonsterPortraitsController(IAuthService authService, IMonsterPortraitService monsterPortraitService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MonsterPortraitOverrideDto>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var entries = await monsterPortraitService.GetAllAsync(cancellationToken);
        return Ok(entries);
    }

    [HttpPut]
    public async Task<ActionResult<MonsterPortraitOverrideDto>> Upsert([FromBody] UpsertMonsterPortraitOverrideRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var saved = await monsterPortraitService.UpsertAsync(user.Id, request, cancellationToken);
            return Ok(saved);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
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
