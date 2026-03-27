using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CharactersController(ICharacterService characterService, IAuthService authService) : ControllerBase
{
    [HttpPost("backstory/generate")]
    public async Task<ActionResult<GenerateCharacterBackstoryResponse>> GenerateBackstory([FromBody] GenerateCharacterBackstoryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var generated = await characterService.GenerateBackstoryAsync(request, user.Id, cancellationToken);
            return Ok(generated);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "Backstory generation unavailable.", detail: exception.Message, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Backstory generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPut("{characterId:guid}/backstory")]
    public async Task<ActionResult<CharacterDto>> UpdateBackstory(Guid characterId, [FromBody] UpdateCharacterBackstoryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CharacterDto? updated;
        try
        {
            updated = await characterService.UpdateBackstoryAsync(characterId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Character was not found.");
        }

        return Ok(updated);
    }

    [HttpPut("{characterId:guid}/status")]
    public async Task<ActionResult<CharacterDto>> UpdateStatus(Guid characterId, [FromBody] UpdateCharacterStatusRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CharacterDto? updated;
        try
        {
            updated = await characterService.UpdateStatusAsync(characterId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Character was not found or status was invalid.");
        }

        return Ok(updated);
    }

    [HttpPost("{characterId:guid}/promote")]
    public async Task<ActionResult<CharacterDto>> Promote(Guid characterId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CharacterDto? updated;
        try
        {
            updated = await characterService.PromoteAsync(characterId, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Character was not found.");
        }

        return Ok(updated);
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
