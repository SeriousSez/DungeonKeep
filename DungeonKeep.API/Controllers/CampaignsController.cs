using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CampaignsController(ICampaignService campaignService, ICharacterService characterService, IAuthService authService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CampaignDto>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var campaigns = await campaignService.GetAllAsync(user.Id, cancellationToken);
        return Ok(campaigns);
    }

    [HttpPost]
    public async Task<ActionResult<CampaignDto>> Create([FromBody] CreateCampaignRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Campaign name is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var created = await campaignService.CreateAsync(request, user, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpGet("{campaignId:guid}/characters")]
    public async Task<ActionResult<IReadOnlyList<CharacterDto>>> GetCharacters(Guid campaignId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var characters = await characterService.GetByCampaignAsync(campaignId, user.Id, cancellationToken);
            return Ok(characters);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/characters")]
    public async Task<ActionResult<CharacterDto>> CreateCharacter(Guid campaignId, [FromBody] CreateCharacterRequest request, CancellationToken cancellationToken)
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
            var created = await characterService.CreateAsync(campaignId, request, user, cancellationToken);
            return CreatedAtAction(nameof(GetCharacters), new { campaignId }, created);
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

    [HttpPut("{campaignId:guid}/threads/archive")]
    public async Task<ActionResult<CampaignDto>> ArchiveThread(Guid campaignId, [FromBody] ArchiveCampaignThreadRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Thread))
        {
            return BadRequest("Thread text is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.ArchiveThreadAsync(campaignId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign or thread was not found.");
        }

        return Ok(updated);
    }

    [HttpPost("{campaignId:guid}/invites")]
    public async Task<ActionResult<CampaignDto>> InviteMember(Guid campaignId, [FromBody] InviteCampaignMemberRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Invite email is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.InviteMemberAsync(campaignId, request, user, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign was not found.");
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
