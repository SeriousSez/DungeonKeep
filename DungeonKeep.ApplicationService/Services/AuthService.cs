using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace DungeonKeep.ApplicationService.Services;

public sealed class AuthService(IAuthRepository authRepository, IAccountActivationEmailService accountActivationEmailService) : IAuthService
{
    private static readonly TimeSpan ActivationCodeLifetime = TimeSpan.FromMinutes(20);

    public async Task<SignupPendingActivationDto> SignupAsync(SignupRequest request, string? clientBaseUrl, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(request.DisplayName) || string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException("Display name, email, and password are required.");
        }

        var existingUser = await authRepository.GetUserByEmailAsync(normalizedEmail, cancellationToken);
        if (existingUser is not null && existingUser.IsEmailVerified)
        {
            throw new InvalidOperationException("An account with that email already exists.");
        }

        var activationCode = CreateActivationCode();
        var activationExpiresAtUtc = DateTime.UtcNow.Add(ActivationCodeLifetime);

        AppUser user;
        if (existingUser is null)
        {
            user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                DisplayName = request.DisplayName.Trim(),
                CreatedAtUtc = DateTime.UtcNow,
                IsEmailVerified = false
            };
            user.PasswordHash = HashPassword(request.Password);
            user.ActivationCodeHash = HashActivationCode(activationCode);
            user.ActivationCodeExpiresAtUtc = activationExpiresAtUtc;

            user = await authRepository.AddUserAsync(user, cancellationToken);
        }
        else
        {
            existingUser.DisplayName = request.DisplayName.Trim();
            existingUser.PasswordHash = HashPassword(request.Password);
            existingUser.IsEmailVerified = false;
            existingUser.ActivationCodeHash = HashActivationCode(activationCode);
            existingUser.ActivationCodeExpiresAtUtc = activationExpiresAtUtc;
            user = await authRepository.UpdateUserAsync(existingUser, cancellationToken);
        }

        await accountActivationEmailService.SendActivationCodeAsync(
            new AccountActivationEmail(
                user.Email,
                user.DisplayName,
                activationCode,
                BuildActivationUrl(clientBaseUrl, user.Email),
                activationExpiresAtUtc),
            cancellationToken);

        return new SignupPendingActivationDto(
            user.Email,
            "Check your email for the activation code. You need to activate your account before signing in."
        );
    }

    public async Task<ActivationResultDto> ActivateAsync(ActivateAccountRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var code = request.Code.Trim();
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(code))
        {
            throw new InvalidOperationException("Email and activation code are required.");
        }

        var user = await authRepository.GetUserByEmailAsync(normalizedEmail, cancellationToken)
            ?? throw new InvalidOperationException("Activation code is invalid or expired.");

        if (user.IsEmailVerified)
        {
            return new ActivationResultDto(user.Email, "Account already activated. You can sign in now.");
        }

        if (user.ActivationCodeExpiresAtUtc is null
            || user.ActivationCodeExpiresAtUtc <= DateTime.UtcNow
            || !VerifyActivationCode(user.ActivationCodeHash, code))
        {
            throw new InvalidOperationException("Activation code is invalid or expired.");
        }

        user.IsEmailVerified = true;
        user.ActivationCodeHash = string.Empty;
        user.ActivationCodeExpiresAtUtc = null;

        await authRepository.UpdateUserAsync(user, cancellationToken);
        await authRepository.ActivatePendingMembershipsAsync(user.Email, user.Id, cancellationToken);

        return new ActivationResultDto(user.Email, "Account activated. You can sign in now.");
    }

    public async Task<ActivationResultDto> ResendActivationCodeAsync(ResendActivationCodeRequest request, string? clientBaseUrl, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            throw new InvalidOperationException("Email is required.");
        }

        var user = await authRepository.GetUserByEmailAsync(normalizedEmail, cancellationToken)
            ?? throw new InvalidOperationException("No account exists for that email.");

        if (user.IsEmailVerified)
        {
            return new ActivationResultDto(user.Email, "Account already activated. You can sign in now.");
        }

        var activationCode = CreateActivationCode();
        var activationExpiresAtUtc = DateTime.UtcNow.Add(ActivationCodeLifetime);
        user.ActivationCodeHash = HashActivationCode(activationCode);
        user.ActivationCodeExpiresAtUtc = activationExpiresAtUtc;

        await authRepository.UpdateUserAsync(user, cancellationToken);
        await accountActivationEmailService.SendActivationCodeAsync(
            new AccountActivationEmail(
                user.Email,
                user.DisplayName,
                activationCode,
                BuildActivationUrl(clientBaseUrl, user.Email),
                activationExpiresAtUtc),
            cancellationToken);

        return new ActivationResultDto(
            user.Email,
            "A new activation code was sent. Use it before signing in."
        );
    }

    public async Task<AuthSessionDto?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var user = await authRepository.GetUserByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null)
        {
            return null;
        }

        if (!VerifyPassword(user.PasswordHash, request.Password))
        {
            return null;
        }

        if (!user.IsEmailVerified)
        {
            throw new AccountActivationRequiredException(user.Email);
        }

        var session = await CreateSessionAsync(user, cancellationToken);
        return MapSession(session);
    }

    public async Task<AuthenticatedUser?> GetAuthenticatedUserByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var session = await authRepository.GetSessionByTokenAsync(token.Trim(), cancellationToken);
        if (session?.User is null || session.ExpiresAtUtc <= DateTime.UtcNow)
        {
            return null;
        }

        return new AuthenticatedUser(session.User.Id, session.User.Email, session.User.DisplayName);
    }

    private async Task<AuthSession> CreateSessionAsync(AppUser user, CancellationToken cancellationToken)
    {
        var session = new AuthSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(30)
        };

        var savedSession = await authRepository.AddSessionAsync(session, cancellationToken);
        savedSession.User = user;
        return savedSession;
    }

    private static AuthSessionDto MapSession(AuthSession session)
    {
        var user = session.User ?? throw new InvalidOperationException("Session user was not loaded.");
        return new AuthSessionDto(
            session.Token,
            new AuthUserDto(user.Id, user.Email, user.DisplayName)
        );
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string CreateActivationCode()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    }

    private static string HashActivationCode(string activationCode)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(activationCode));
        return Convert.ToBase64String(hash);
    }

    private static bool VerifyActivationCode(string storedHash, string activationCode)
    {
        if (string.IsNullOrWhiteSpace(storedHash) || string.IsNullOrWhiteSpace(activationCode))
        {
            return false;
        }

        try
        {
            var expectedHash = Convert.FromBase64String(storedHash);
            var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(activationCode.Trim()));
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch
        {
            return false;
        }
    }

    private static string BuildActivationUrl(string? clientBaseUrl, string email)
    {
        var normalizedBaseUrl = string.IsNullOrWhiteSpace(clientBaseUrl)
            ? "http://localhost:4200"
            : clientBaseUrl.Trim().TrimEnd('/');

        return $"{normalizedBaseUrl}/auth?mode=activate&email={Uri.EscapeDataString(email)}";
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string storedHash, string password)
    {
        var parts = storedHash.Split(':', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2)
        {
            return false;
        }

        try
        {
            var salt = Convert.FromBase64String(parts[0]);
            var expectedHash = Convert.FromBase64String(parts[1]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, 100_000, HashAlgorithmName.SHA256, expectedHash.Length);
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch
        {
            return false;
        }
    }
}