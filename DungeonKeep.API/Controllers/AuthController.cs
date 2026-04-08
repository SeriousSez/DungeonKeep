using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("signup")]
    public async Task<ActionResult<SignupPendingActivationDto>> Signup([FromBody] SignupRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await authService.SignupAsync(request, cancellationToken);
            return Ok(created);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPost("activate")]
    public async Task<ActionResult<ActivationResultDto>> Activate([FromBody] ActivateAccountRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.ActivateAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPost("resend-activation")]
    public async Task<ActionResult<ActivationResultDto>> ResendActivation([FromBody] ResendActivationCodeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.ResendActivationCodeAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthSessionDto>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var session = await authService.LoginAsync(request, cancellationToken);
            if (session is null)
            {
                return Unauthorized("Email or password was invalid.");
            }

            return Ok(session);
        }
        catch (AccountActivationRequiredException)
        {
            return StatusCode(StatusCodes.Status403Forbidden, "Activate your account with the emailed code before signing in.");
        }
    }

    [HttpGet("session")]
    public async Task<ActionResult<AuthUserDto>> GetSession(CancellationToken cancellationToken)
    {
        var token = ReadBearerToken();
        var user = await authService.GetAuthenticatedUserByTokenAsync(token, cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new AuthUserDto(user.Id, user.Email, user.DisplayName));
    }

    private string ReadBearerToken()
    {
        var authorization = Request.Headers.Authorization.ToString();
        return authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization[7..].Trim()
            : string.Empty;
    }
}