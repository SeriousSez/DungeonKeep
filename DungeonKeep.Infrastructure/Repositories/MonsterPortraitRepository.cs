using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Update;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class MonsterPortraitRepository(DungeonKeepDbContext dbContext) : IMonsterPortraitRepository
{
    private static bool schemaEnsured;

    public async Task<IReadOnlyList<MonsterPortraitOverride>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        EnsureSchema();
        return await dbContext.Set<MonsterPortraitOverride>()
            .AsNoTracking()
            .OrderBy(entry => entry.Slug)
            .ToListAsync(cancellationToken);
    }

    public async Task<MonsterPortraitOverride> UpsertAsync(string slug, string imageUrl, string originalImageUrl, Guid? updatedByUserId, CancellationToken cancellationToken = default)
    {
        EnsureSchema();

        var normalizedSlug = slug.Trim().ToLowerInvariant();
        var entry = await dbContext.Set<MonsterPortraitOverride>()
            .FirstOrDefaultAsync(item => item.Slug == normalizedSlug, cancellationToken);

        if (entry is null)
        {
            entry = new MonsterPortraitOverride
            {
                Slug = normalizedSlug
            };

            dbContext.Set<MonsterPortraitOverride>().Add(entry);
        }

        entry.ImageUrl = imageUrl;
        entry.OriginalImageUrl = originalImageUrl;
        entry.UpdatedAtUtc = DateTime.UtcNow;
        entry.UpdatedByUserId = updatedByUserId;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return entry;
        }
        catch (DbUpdateException ex) when (RequiresSchemaRepair(ex) && EnsureSchema())
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return entry;
        }
    }

    private static bool RequiresSchemaRepair(DbUpdateException exception)
    {
        var detail = exception.GetBaseException().Message;
        return detail.Contains("MonsterPortraitOverrides", StringComparison.OrdinalIgnoreCase);
    }

    private bool EnsureSchema()
    {
        if (schemaEnsured)
        {
            return true;
        }

        try
        {
            var providerName = dbContext.Database.ProviderName ?? string.Empty;
            if (providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                dbContext.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS ""MonsterPortraitOverrides"" (
    ""Slug"" TEXT NOT NULL CONSTRAINT ""PK_MonsterPortraitOverrides"" PRIMARY KEY,
    ""ImageUrl"" TEXT NOT NULL DEFAULT '',
    ""OriginalImageUrl"" TEXT NOT NULL DEFAULT '',
    ""UpdatedAtUtc"" TEXT NOT NULL,
    ""UpdatedByUserId"" TEXT NULL
);");
            }
            else if (providerName.Contains("MySql", StringComparison.OrdinalIgnoreCase))
            {
                dbContext.Database.ExecuteSqlRaw(@"
CREATE TABLE IF NOT EXISTS `MonsterPortraitOverrides` (
    `Slug` varchar(191) NOT NULL,
    `ImageUrl` longtext NOT NULL,
    `OriginalImageUrl` longtext NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedByUserId` char(36) NULL,
    PRIMARY KEY (`Slug`)
);");
            }

            schemaEnsured = true;
            return true;
        }
        catch
        {
            return false;
        }
    }
}
