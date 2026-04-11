using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CharactersController(ICharacterService characterService, IAuthService authService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CharacterDto>>> GetAccessible(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var characters = await characterService.GetAccessibleAsync(user.Id, cancellationToken);
        return Ok(characters);
    }

    [HttpPost("{characterId:guid}/delete")]
    public async Task<IActionResult> DeleteViaPost(Guid characterId, CancellationToken cancellationToken)
    {
        return await DeleteInternal(characterId, cancellationToken);
    }

    [HttpDelete("{characterId:guid}")]
    public async Task<IActionResult> Delete(Guid characterId, CancellationToken cancellationToken)
    {
        return await DeleteInternal(characterId, cancellationToken);
    }

    private async Task<IActionResult> DeleteInternal(Guid characterId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }
        try
        {
            var deleted = await characterService.DeleteAsync(characterId, user.Id, cancellationToken);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }
    [HttpGet("mine/unassigned")]
    public async Task<ActionResult<IReadOnlyList<CharacterDto>>> GetUnassignedOwned(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var characters = await characterService.GetUnassignedOwnedAsync(user.Id, cancellationToken);
        return Ok(characters);
    }

    [HttpPost]
    public async Task<ActionResult<CharacterDto>> Create([FromBody] CreateCharacterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ClassName))
        {
            return BadRequest("Character name and class are required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var created = await characterService.CreateAsync(request.CampaignId, request, user, cancellationToken);
            return CreatedAtAction(nameof(Create), new { id = created.Id }, created);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
        catch (InvalidOperationException)
        {
            return NotFound("Campaign was not found.");
        }
    }

    [HttpPut("{characterId:guid}")]
    public async Task<ActionResult<CharacterDto>> Update(Guid characterId, [FromBody] UpdateCharacterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ClassName))
        {
            return BadRequest("Character name and class are required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CharacterDto? updated;
        try
        {
            updated = await characterService.UpdateAsync(characterId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
        catch (InvalidOperationException)
        {
            return NotFound("Character or campaign was not found.");
        }

        if (updated is null)
        {
            return NotFound("Character or campaign was not found.");
        }

        return Ok(updated);
    }

    [HttpPut("{characterId:guid}/campaign")]
    public async Task<ActionResult<CharacterDto>> UpdateCampaign(Guid characterId, [FromBody] UpdateCharacterCampaignRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CharacterDto? updated;
        try
        {
            updated = await characterService.UpdateCampaignAsync(characterId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
        catch (InvalidOperationException)
        {
            return NotFound("Character or campaign was not found.");
        }

        if (updated is null)
        {
            return NotFound("Character or campaign was not found.");
        }

        return Ok(updated);
    }

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

    [HttpPost("portrait/generate")]
    public async Task<ActionResult<GenerateCharacterPortraitResponse>> GeneratePortrait([FromBody] GenerateCharacterPortraitRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var generated = await characterService.GeneratePortraitAsync(request, user.Id, cancellationToken);
            return Ok(generated);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "Portrait generation unavailable.", detail: exception.Message, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Portrait generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
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
