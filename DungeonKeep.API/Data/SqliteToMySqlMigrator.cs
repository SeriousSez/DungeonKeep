using DungeonKeep.Infrastructure.Configuration;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DungeonKeep.API.Data;

internal static class SqliteToMySqlMigrator
{
    public static async Task<bool> MigrateOnStartupIfNeededAsync(IConfiguration configuration, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (DatabaseConfiguration.GetProvider(configuration) != DatabaseProvider.MySql)
        {
            return false;
        }

        if (!DatabaseConfiguration.ShouldAutoMigrateSqliteToMySqlOnStartup(configuration))
        {
            return false;
        }

        var sqliteConnectionString = DatabaseConfiguration.GetSqliteConnectionString(configuration);
        var sqliteDatabasePath = DatabaseConfiguration.TryResolveSqliteDatabasePath(sqliteConnectionString);

        if (string.IsNullOrWhiteSpace(sqliteDatabasePath) || !File.Exists(sqliteDatabasePath))
        {
            logger.LogInformation("Automatic SQLite-to-MySQL migration skipped because the SQLite source database was not found at {SqliteDatabasePath}.", sqliteDatabasePath ?? "<unknown>");
            return false;
        }

        var mySqlConnectionString = DatabaseConfiguration.GetMySqlConnectionString(configuration);
        if (string.IsNullOrWhiteSpace(mySqlConnectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DungeonKeepMySql must be configured before automatic SQLite-to-MySQL migration can run.");
        }

        var sourceOptions = new DbContextOptionsBuilder<DungeonKeepDbContext>();
        DatabaseConfiguration.ConfigureSqlite(sourceOptions, sqliteConnectionString);

        var targetOptions = new DbContextOptionsBuilder<DungeonKeepDbContext>();
        DatabaseConfiguration.ConfigureMySql(targetOptions, mySqlConnectionString);

        await using var sourceContext = new DungeonKeepDbContext(sourceOptions.Options);
        await using var targetContext = new DungeonKeepDbContext(targetOptions.Options);

        await targetContext.Database.EnsureCreatedAsync(cancellationToken);

        if (await TargetHasDataAsync(targetContext, cancellationToken))
        {
            logger.LogInformation("Automatic SQLite-to-MySQL migration skipped because the MySQL target already contains DungeonKeep data.");
            return false;
        }

        if (!await SourceHasDataAsync(sourceContext, cancellationToken))
        {
            logger.LogInformation("Automatic SQLite-to-MySQL migration skipped because the SQLite source database contains no DungeonKeep data.");
            return false;
        }

        await CopyDataAsync(sourceContext, targetContext, logger, cancellationToken);
        return true;
    }

    public static async Task MigrateAsync(IConfiguration configuration, ILogger logger, CancellationToken cancellationToken = default)
    {
        var sqliteConnectionString = DatabaseConfiguration.GetSqliteConnectionString(configuration);
        var mySqlConnectionString = DatabaseConfiguration.GetMySqlConnectionString(configuration);

        if (string.IsNullOrWhiteSpace(mySqlConnectionString))
        {
            throw new InvalidOperationException("ConnectionStrings:DungeonKeepMySql must be configured before running the SQLite-to-MySQL migration.");
        }

        var sourceOptions = new DbContextOptionsBuilder<DungeonKeepDbContext>();
        DatabaseConfiguration.ConfigureSqlite(sourceOptions, sqliteConnectionString);

        var targetOptions = new DbContextOptionsBuilder<DungeonKeepDbContext>();
        DatabaseConfiguration.ConfigureMySql(targetOptions, mySqlConnectionString);

        await using var sourceContext = new DungeonKeepDbContext(sourceOptions.Options);
        await using var targetContext = new DungeonKeepDbContext(targetOptions.Options);

        await targetContext.Database.EnsureCreatedAsync(cancellationToken);

        if (await TargetHasDataAsync(targetContext, cancellationToken))
        {
            throw new InvalidOperationException("The configured MySQL database already contains DungeonKeep data. Aborting migration to avoid duplicate imports.");
        }

        if (!await SourceHasDataAsync(sourceContext, cancellationToken))
        {
            throw new InvalidOperationException("The configured SQLite database does not contain DungeonKeep data to migrate.");
        }

        await CopyDataAsync(sourceContext, targetContext, logger, cancellationToken);
    }

    private static async Task CopyDataAsync(
        DungeonKeepDbContext sourceContext,
        DungeonKeepDbContext targetContext,
        ILogger logger,
        CancellationToken cancellationToken)
    {

        var users = await sourceContext.AppUsers.AsNoTracking().ToListAsync(cancellationToken);
        var campaigns = await sourceContext.Campaigns.AsNoTracking().ToListAsync(cancellationToken);
        var characters = await sourceContext.Characters.AsNoTracking().ToListAsync(cancellationToken);
        var memberships = await sourceContext.CampaignMemberships.AsNoTracking().ToListAsync(cancellationToken);
        var sessions = await sourceContext.AuthSessions.AsNoTracking().ToListAsync(cancellationToken);
        var assignments = await sourceContext.CharacterCampaignAssignments.AsNoTracking().ToListAsync(cancellationToken);

        targetContext.ChangeTracker.AutoDetectChangesEnabled = false;

        await using var transaction = await targetContext.Database.BeginTransactionAsync(cancellationToken);

        targetContext.AppUsers.AddRange(users);
        await targetContext.SaveChangesAsync(cancellationToken);

        targetContext.Campaigns.AddRange(campaigns);
        await targetContext.SaveChangesAsync(cancellationToken);

        targetContext.Characters.AddRange(characters);
        await targetContext.SaveChangesAsync(cancellationToken);

        targetContext.CampaignMemberships.AddRange(memberships);
        await targetContext.SaveChangesAsync(cancellationToken);

        targetContext.AuthSessions.AddRange(sessions);
        await targetContext.SaveChangesAsync(cancellationToken);

        targetContext.CharacterCampaignAssignments.AddRange(assignments);
        await targetContext.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        logger.LogInformation(
            "Migrated SQLite data to MySQL: {UserCount} users, {CampaignCount} campaigns, {CharacterCount} characters, {MembershipCount} memberships, {SessionCount} auth sessions, {AssignmentCount} character assignments.",
            users.Count,
            campaigns.Count,
            characters.Count,
            memberships.Count,
            sessions.Count,
            assignments.Count);
    }

    private static async Task<bool> SourceHasDataAsync(DungeonKeepDbContext sourceContext, CancellationToken cancellationToken)
    {
        try
        {
            return await sourceContext.AppUsers.AnyAsync(cancellationToken)
                || await sourceContext.Campaigns.AnyAsync(cancellationToken)
                || await sourceContext.Characters.AnyAsync(cancellationToken)
                || await sourceContext.CampaignMemberships.AnyAsync(cancellationToken)
                || await sourceContext.AuthSessions.AnyAsync(cancellationToken)
                || await sourceContext.CharacterCampaignAssignments.AnyAsync(cancellationToken);
        }
        catch
        {
            return false;
        }
    }

    private static async Task<bool> TargetHasDataAsync(DungeonKeepDbContext targetContext, CancellationToken cancellationToken)
    {
        return await targetContext.AppUsers.AnyAsync(cancellationToken)
            || await targetContext.Campaigns.AnyAsync(cancellationToken)
            || await targetContext.Characters.AnyAsync(cancellationToken)
            || await targetContext.CampaignMemberships.AnyAsync(cancellationToken)
            || await targetContext.AuthSessions.AnyAsync(cancellationToken)
            || await targetContext.CharacterCampaignAssignments.AnyAsync(cancellationToken);
    }
}