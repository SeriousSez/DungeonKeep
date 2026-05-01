using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IAuthService
{
    Task<SignupPendingActivationDto> SignupAsync(SignupRequest request, string? clientBaseUrl, CancellationToken cancellationToken = default);
    Task<ActivationResultDto> ActivateAsync(ActivateAccountRequest request, CancellationToken cancellationToken = default);
    Task<ActivationResultDto> ResendActivationCodeAsync(ResendActivationCodeRequest request, string? clientBaseUrl, CancellationToken cancellationToken = default);
    Task<AuthSessionDto?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthenticatedUser?> GetAuthenticatedUserByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<AuthUserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<UserLibrariesDto> GetUserLibrariesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserLibrariesDto> SaveUserNpcLibraryAsync(Guid userId, string json, CancellationToken cancellationToken = default);
    Task<UserLibrariesDto> SaveUserCustomTableLibraryAsync(Guid userId, string json, CancellationToken cancellationToken = default);
    Task<UserLibrariesDto> SaveUserMonsterLibraryAsync(Guid userId, string json, CancellationToken cancellationToken = default);
    Task<UserLibrariesDto> SaveUserMonsterReferenceAsync(Guid userId, string json, CancellationToken cancellationToken = default);
}