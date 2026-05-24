using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IPasswordResetEmailService
{
    Task SendPasswordResetCodeAsync(PasswordResetEmail passwordResetEmail, CancellationToken cancellationToken = default);
}
