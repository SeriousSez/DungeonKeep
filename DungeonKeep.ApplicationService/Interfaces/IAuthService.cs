using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IAuthService
{
    Task<AuthSessionDto> SignupAsync(SignupRequest request, CancellationToken cancellationToken = default);
    Task<AuthSessionDto?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthenticatedUser?> GetAuthenticatedUserByTokenAsync(string token, CancellationToken cancellationToken = default);
}