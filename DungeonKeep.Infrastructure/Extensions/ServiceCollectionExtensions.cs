using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Infrastructure.Backstory;
using DungeonKeep.Infrastructure.Persistence;
using DungeonKeep.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DungeonKeep.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDungeonKeepInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DungeonKeep")
            ?? "Data Source=dungeonkeep.dev.db";

        services.AddDbContext<DungeonKeepDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddHttpClient<IBackstoryGenerator, OpenAiBackstoryGenerator>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ICampaignRepository, CampaignRepository>();
        services.AddScoped<ICharacterRepository, CharacterRepository>();

        return services;
    }
}
