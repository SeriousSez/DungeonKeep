using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService authService, ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("signup")]
    public async Task<ActionResult<SignupPendingActivationDto>> Signup([FromBody] SignupRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var created = await authService.SignupAsync(request, GetClientBaseUrl(), cancellationToken);
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
            var result = await authService.ResendActivationCodeAsync(request, GetClientBaseUrl(), cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
    }

    [HttpPost("request-password-reset")]
    public async Task<ActionResult<PasswordResetRequestAcceptedDto>> RequestPasswordReset([FromBody] RequestPasswordResetRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.RequestPasswordResetAsync(request, GetClientBaseUrl(), cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (Exception exception)
        {
            // Keep response generic to avoid account enumeration and avoid surfacing transient infrastructure failures.
            logger.LogError(exception, "Password reset request failed unexpectedly for {Email}.", request.Email);
            return Ok(new PasswordResetRequestAcceptedDto("If an account exists for that email, a password reset code has been sent."));
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<PasswordResetResultDto>> ResetPassword([FromBody] CompletePasswordResetRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.CompletePasswordResetAsync(request, cancellationToken);
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

    private string? GetClientBaseUrl()
    {
        if (TryGetAbsoluteHttpUrl(Request.Headers.Origin, out var originBaseUrl))
        {
            return originBaseUrl;
        }

        if (TryGetAbsoluteHttpUrl(Request.Headers.Referer, out var refererBaseUrl))
        {
            return refererBaseUrl;
        }

        return null;
    }

    private static bool TryGetAbsoluteHttpUrl(StringValues headerValues, out string? baseUrl)
    {
        baseUrl = null;
        var candidate = headerValues.FirstOrDefault();

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        baseUrl = uri.GetLeftPart(UriPartial.Authority);
        return true;
    }
}