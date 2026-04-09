using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.Infrastructure.Email;

public sealed class NoOpAccountActivationEmailService(ILogger<NoOpAccountActivationEmailService> logger) : IAccountActivationEmailService
{
    public Task SendActivationCodeAsync(AccountActivationEmail activationEmail, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Account activation email delivery is disabled. Skipping email to {RecipientEmail}. Activation code: {ActivationCode}",
            activationEmail.RecipientEmail,
            activationEmail.ActivationCode);

        return Task.CompletedTask;
    }
}