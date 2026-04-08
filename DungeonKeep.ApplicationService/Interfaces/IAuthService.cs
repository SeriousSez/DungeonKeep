using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IAuthService
{
    Task<SignupPendingActivationDto> SignupAsync(SignupRequest request, CancellationToken cancellationToken = default);
    Task<ActivationResultDto> ActivateAsync(ActivateAccountRequest request, CancellationToken cancellationToken = default);
    Task<ActivationResultDto> ResendActivationCodeAsync(ResendActivationCodeRequest request, CancellationToken cancellationToken = default);
    Task<AuthSessionDto?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthenticatedUser?> GetAuthenticatedUserByTokenAsync(string token, CancellationToken cancellationToken = default);
}