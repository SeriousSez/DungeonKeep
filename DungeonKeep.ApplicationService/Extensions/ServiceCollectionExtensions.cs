using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.ApplicationService.Services;
using DungeonKeep.ApplicationService.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace DungeonKeep.ApplicationService.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDungeonKeepApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICampaignService, CampaignService>();
        services.AddScoped<ICharacterService, CharacterService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IMessageService, MessageService>();

        services.AddValidatorsFromAssemblyContaining<SignupRequestValidator>();

        return services;
    }
}
