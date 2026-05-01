using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/account")]
public sealed class AccountController(IAuthService authService) : ControllerBase
{
    [HttpPut("profile")]
    public async Task<ActionResult<AuthUserDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        try
        {
            var updated = await authService.UpdateProfileAsync(user.Id, request, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        try
        {
            await authService.ChangePasswordAsync(user.Id, request, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("libraries")]
    public async Task<ActionResult<UserLibrariesDto>> GetLibraries(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.GetUserLibrariesAsync(user.Id, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("npc-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveNpcLibrary([FromBody] SaveUserNpcLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserNpcLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("custom-table-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveCustomTableLibrary([FromBody] SaveUserCustomTableLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserCustomTableLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("monster-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveMonsterLibrary([FromBody] SaveUserMonsterLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserMonsterLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("monster-reference")]
    public async Task<ActionResult<UserLibrariesDto>> SaveMonsterReference([FromBody] SaveUserMonsterReferenceRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserMonsterReferenceAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
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
