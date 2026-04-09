using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Infrastructure.Configuration;
using DungeonKeep.Infrastructure.Backstory;
using DungeonKeep.Infrastructure.Email;
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
        var databaseProvider = DatabaseConfiguration.GetProvider(configuration);
        var emailOptions = SmtpCampaignInviteEmailOptions.FromConfiguration(configuration);

        services.AddDbContext<DungeonKeepDbContext>(options =>
        {
            var connectionString = DatabaseConfiguration.GetActiveConnectionString(configuration);

            if (databaseProvider == DatabaseProvider.MySql)
            {
                DatabaseConfiguration.ConfigureMySql(options, connectionString);
                return;
            }

            DatabaseConfiguration.ConfigureSqlite(options, connectionString);
        });

        services.AddHttpClient<IBackstoryGenerator, OpenAiBackstoryGenerator>();
        services.AddSingleton(emailOptions);
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<ICampaignRepository, CampaignRepository>();
        services.AddScoped<ICharacterRepository, CharacterRepository>();

        if (emailOptions.IsEnabled)
        {
            services.AddScoped<IAccountActivationEmailService, SmtpAccountActivationEmailService>();
            services.AddScoped<ICampaignInviteEmailService, SmtpCampaignInviteEmailService>();
        }
        else
        {
            services.AddScoped<IAccountActivationEmailService, NoOpAccountActivationEmailService>();
            services.AddScoped<ICampaignInviteEmailService, NoOpCampaignInviteEmailService>();
        }

        return services;
    }
}
