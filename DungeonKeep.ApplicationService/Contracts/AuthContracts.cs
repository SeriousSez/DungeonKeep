namespace DungeonKeep.ApplicationService.Contracts;

public sealed record AuthenticatedUser(
    Guid Id,
    string Email,
    string DisplayName
);

public sealed record AuthUserDto(
    Guid Id,
    string Email,
    string DisplayName
);

public sealed record AuthSessionDto(
    string Token,
    AuthUserDto User
);

public sealed record SignupPendingActivationDto(
    string Email,
    string Message
);

public sealed record ActivationResultDto(
    string Email,
    string Message
);

public sealed record SignupRequest(
    string DisplayName,
    string Email,
    string Password
);

public sealed record LoginRequest(
    string Email,
    string Password
);

public sealed record ActivateAccountRequest(
    string Email,
    string Code
);

public sealed record ResendActivationCodeRequest(string Email);

public sealed record UpdateProfileRequest(string DisplayName, string Email);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record UserLibrariesDto(
    string NpcLibraryJson,
    string CustomTableLibraryJson,
    string MonsterLibraryJson,
    string MonsterReferenceJson
);

public sealed record SaveUserNpcLibraryRequest(string Json);
public sealed record SaveUserCustomTableLibraryRequest(string Json);
public sealed record SaveUserMonsterLibraryRequest(string Json);
public sealed record SaveUserMonsterReferenceRequest(string Json);

public sealed record AccountActivationEmail(
    string RecipientEmail,
    string RecipientDisplayName,
    string ActivationCode,
    string ActivationUrl,
    DateTime ExpiresAtUtc
);

public sealed class AccountActivationRequiredException(string email)
    : Exception("Account activation is required before you can sign in.")
{
    public string Email { get; } = email;
}