using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace DungeonKeep.ApplicationService.Services;

public sealed class AuthService(IAuthRepository authRepository) : IAuthService
{
    public async Task<AuthSessionDto> SignupAsync(SignupRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(request.DisplayName) || string.IsNullOrWhiteSpace(normalizedEmail) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidOperationException("Display name, email, and password are required.");
        }

        var existingUser = await authRepository.GetUserByEmailAsync(normalizedEmail, cancellationToken);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("An account with that email already exists.");
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            DisplayName = request.DisplayName.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
        user.PasswordHash = HashPassword(request.Password);

        var createdUser = await authRepository.AddUserAsync(user, cancellationToken);
        await authRepository.ActivatePendingMembershipsAsync(createdUser.Email, createdUser.Id, cancellationToken);

        var session = await CreateSessionAsync(createdUser, cancellationToken);
        return MapSession(session);
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