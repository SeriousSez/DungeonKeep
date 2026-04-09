using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IAccountActivationEmailService
{
    Task SendActivationCodeAsync(AccountActivationEmail activationEmail, CancellationToken cancellationToken = default);
}