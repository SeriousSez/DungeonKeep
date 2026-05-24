using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.Infrastructure.Email;

public sealed class NoOpPasswordResetEmailService(ILogger<NoOpPasswordResetEmailService> logger) : IPasswordResetEmailService
{
    public Task SendPasswordResetCodeAsync(PasswordResetEmail passwordResetEmail, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Password reset email delivery is disabled. Skipping email to {RecipientEmail}. Reset code: {ResetCode}",
            passwordResetEmail.RecipientEmail,
            passwordResetEmail.ResetCode);

        return Task.CompletedTask;
    }
}
