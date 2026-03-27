using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.ApplicationService.Services;
using Microsoft.Extensions.DependencyInjection;

namespace DungeonKeep.ApplicationService.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDungeonKeepApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICampaignService, CampaignService>();
        services.AddScoped<ICharacterService, CharacterService>();

        return services;
    }
}
