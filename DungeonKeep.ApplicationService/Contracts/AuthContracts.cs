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

public sealed record SignupRequest(
    string DisplayName,
    string Email,
    string Password
);

public sealed record LoginRequest(
    string Email,
    string Password
);