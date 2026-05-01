using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Update;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class AuthRepository(DungeonKeepDbContext dbContext) : IAuthRepository
{
    private static bool userSchemaEnsured;

    public async Task<AppUser?> GetUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
    {
        EnsureUserSchema();
        return await dbContext.AppUsers.FirstOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);
    }

    public async Task<AppUser?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        EnsureUserSchema();
        return await dbContext.AppUsers.FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public async Task<AppUser> AddUserAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        dbContext.AppUsers.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<AppUser> UpdateUserAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        dbContext.AppUsers.Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<AuthSession> AddSessionAsync(AuthSession session, CancellationToken cancellationToken = default)
    {
        dbContext.AuthSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<AuthSession?> GetSessionByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        EnsureUserSchema();
        return await dbContext.AuthSessions
            .Include(session => session.User)
            .FirstOrDefaultAsync(session => session.Token == token, cancellationToken);
    }

    public async Task<IReadOnlyList<(Guid CampaignId, string CampaignName, Guid? InvitedByUserId)>> ActivatePendingMembershipsAsync(string normalizedEmail, Guid userId, CancellationToken cancellationToken = default)
    {
        var memberships = await dbContext.CampaignMemberships
            .Include(membership => membership.Campaign)
            .Where(membership => membership.Email == normalizedEmail && membership.UserId == null && membership.Status == "Pending")
            .ToListAsync(cancellationToken);

        foreach (var membership in memberships)
        {
            membership.UserId = userId;
            // Keep Status as "Pending" so the user can accept or decline from notifications.
        }

        if (memberships.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return memberships
            .Where(m => m.Campaign is not null)
            .Select(m => (m.CampaignId, m.Campaign!.Name, m.InvitedByUserId))
            .ToList();
    }

    public async Task<AppUser?> UpdateUserLibraryAsync(Guid userId, string field, string json, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.AppUsers.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var normalizedJson = string.IsNullOrWhiteSpace(json) ? "[]" : json;

        switch (field)
        {
            case nameof(AppUser.NpcLibraryJson):
                user.NpcLibraryJson = normalizedJson;
                break;
            case nameof(AppUser.CustomTableLibraryJson):
                user.CustomTableLibraryJson = normalizedJson;
                break;
            case nameof(AppUser.MonsterLibraryJson):
                user.MonsterLibraryJson = normalizedJson;
                break;
            case nameof(AppUser.MonsterReferenceJson):
                user.MonsterReferenceJson = normalizedJson;
                break;
            default:
                throw new InvalidOperationException($"Unsupported user library field '{field}'.");
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }
        catch (DbUpdateException ex) when (RequiresUserSchemaRepair(ex) && EnsureUserSchema())
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }
    }

    private static bool RequiresUserSchemaRepair(DbUpdateException exception)
    {
        var detail = exception.GetBaseException().Message;
        return detail.Contains("table AppUsers has no column named", StringComparison.OrdinalIgnoreCase);
    }

    private bool EnsureUserSchema()
    {
        if (userSchemaEnsured)
        {
            return true;
        }

        try
        {
            EnsureColumnExists("AppUsers", "IsEmailVerified", "INTEGER NOT NULL DEFAULT 0", "TINYINT(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("AppUsers", "ActivationCodeHash", "TEXT NOT NULL DEFAULT ''", "TEXT NOT NULL");
            EnsureColumnExists("AppUsers", "ActivationCodeExpiresAtUtc", "TEXT NULL", "DATETIME(6) NULL");

            EnsureColumnExists("AppUsers", "NpcLibraryJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists("AppUsers", "CustomTableLibraryJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists("AppUsers", "MonsterLibraryJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists("AppUsers", "MonsterReferenceJson", "TEXT NOT NULL DEFAULT '[]'");

            EnsureLegacyUsersCanSignIn();
            userSchemaEnsured = true;
        }
        catch
        {
            return false;
        }

        return true;
    }

    private void EnsureColumnExists(string tableName, string columnName, string sqliteColumnDefinition, string? mySqlColumnDefinition = null)
    {
        var providerName = dbContext.Database.ProviderName ?? string.Empty;

        if (providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            EnsureSqliteColumnExists(tableName, columnName, sqliteColumnDefinition);
            return;
        }

        if (providerName.Contains("MySql", StringComparison.OrdinalIgnoreCase))
        {
            EnsureMySqlColumnExists(tableName, columnName, mySqlColumnDefinition ?? sqliteColumnDefinition);
            return;
        }
    }

    private void EnsureSqliteColumnExists(string tableName, string columnName, string columnDefinition)
    {
        using var connection = dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }

        using var existsCommand = connection.CreateCommand();
        existsCommand.CommandText = $"SELECT 1 FROM pragma_table_info('{tableName}') WHERE name = '{columnName}' LIMIT 1;";
        if (existsCommand.ExecuteScalar() is not null)
        {
            return;
        }

        dbContext.Database.ExecuteSqlRaw("ALTER TABLE \"" + tableName + "\" ADD COLUMN \"" + columnName + "\" " + columnDefinition + ";");
    }

    private void EnsureMySqlColumnExists(string tableName, string columnName, string columnDefinition)
    {
        using var connection = dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }

        using var existsCommand = connection.CreateCommand();
        existsCommand.CommandText = $"SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tableName}' AND COLUMN_NAME = '{columnName}' LIMIT 1;";
        if (existsCommand.ExecuteScalar() is not null)
        {
            return;
        }

        dbContext.Database.ExecuteSqlRaw("ALTER TABLE `" + tableName + "` ADD COLUMN `" + columnName + "` " + columnDefinition + ";");
    }

    private void EnsureLegacyUsersCanSignIn()
    {
        var providerName = dbContext.Database.ProviderName ?? string.Empty;

        if (providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            dbContext.Database.ExecuteSqlRaw(
                "UPDATE \"AppUsers\" SET \"IsEmailVerified\" = 1 WHERE \"IsEmailVerified\" = 0 AND (\"ActivationCodeHash\" IS NULL OR \"ActivationCodeHash\" = '') AND \"ActivationCodeExpiresAtUtc\" IS NULL;"
            );
            return;
        }

        if (providerName.Contains("MySql", StringComparison.OrdinalIgnoreCase))
        {
            dbContext.Database.ExecuteSqlRaw(
                "UPDATE `AppUsers` SET `IsEmailVerified` = 1 WHERE `IsEmailVerified` = 0 AND (`ActivationCodeHash` IS NULL OR `ActivationCodeHash` = '') AND `ActivationCodeExpiresAtUtc` IS NULL;"
            );
        }
    }
}