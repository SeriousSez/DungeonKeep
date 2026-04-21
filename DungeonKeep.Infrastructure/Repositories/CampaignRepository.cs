using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Text.Json;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class CampaignRepository(DungeonKeepDbContext dbContext) : ICampaignRepository
{
    private const double DefaultMapGridColumns = 25d;
    private const double DefaultMapGridRows = 17.5d;
    private const string DefaultMapGridColor = "#745338";
    private const double DefaultMapGridOffsetX = 0d;
    private const double DefaultMapGridOffsetY = 0d;
    private static readonly CampaignMapBoardDto DefaultCampaignMapBoard = new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "Main Map",
        "Parchment",
        string.Empty,
        DefaultMapGridColumns,
        DefaultMapGridRows,
        DefaultMapGridColor,
        DefaultMapGridOffsetX,
        DefaultMapGridOffsetY,
        [],
        [],
        [],
        [],
        [],
        [],
        new CampaignMapLayersDto([], [], []),
        []);
    private readonly bool campaignSchemaReady = dbContext.Database.IsSqlite() ? EnsureCampaignSchema(dbContext) : true;

    public async Task<IReadOnlyList<CampaignSummaryRecord>> GetAllSummariesForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        return await dbContext.Campaigns
            .AsNoTracking()
            .Where(campaign => campaign.Memberships.Any(membership => membership.UserId == userId && membership.Status == "Active"))
            .OrderByDescending(campaign => campaign.CreatedAtUtc)
            .Select(campaign => new CampaignSummaryRecord(
                campaign.Id,
                campaign.Name,
                campaign.Setting,
                campaign.Tone,
                campaign.LevelStart,
                campaign.LevelEnd,
                campaign.Hook,
                campaign.NextSession,
                campaign.Summary,
                campaign.CreatedAtUtc,
                campaign.CharacterAssignments.Count,
                campaign.SessionsJson,
                campaign.NpcsJson,
                campaign.OpenThreadsJson,
                campaign.Memberships
                    .Where(membership => membership.UserId == userId && membership.Status == "Active")
                    .Select(membership => membership.Role)
                    .FirstOrDefault() ?? "Member"
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Campaign>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        return await dbContext.Campaigns
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.CharacterAssignments)
            .Where(c => c.Memberships.Any(membership => membership.UserId == userId && membership.Status == "Active"))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        return await dbContext.Campaigns
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.CharacterAssignments)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Campaign> AddAsync(Campaign campaign, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        dbContext.Campaigns.Add(campaign);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (RequiresCampaignSchemaRepair(exception))
        {
            EnsureCampaignSchema(dbContext);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return campaign;
    }

    public async Task<Campaign?> UpdateAsync(Guid campaignId, string name, string setting, string tone, int levelStart, int levelEnd, string hook, string nextSession, string summary, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        campaign.Name = name;
        campaign.Setting = setting;
        campaign.Tone = tone;
        campaign.LevelStart = levelStart;
        campaign.LevelEnd = levelEnd;
        campaign.Hook = hook;
        campaign.NextSession = nextSession;
        campaign.Summary = summary;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    private static bool EnsureCampaignSchema(DungeonKeepDbContext dbContext)
    {
        try
        {
            using var connection = dbContext.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }

            dbContext.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS \"CampaignMemberships\" (\"Id\" TEXT NOT NULL CONSTRAINT \"PK_CampaignMemberships\" PRIMARY KEY, \"CampaignId\" TEXT NOT NULL, \"UserId\" TEXT NULL, \"Email\" TEXT NOT NULL, \"Role\" TEXT NOT NULL DEFAULT 'Member', \"Status\" TEXT NOT NULL DEFAULT 'Pending', \"InvitedByUserId\" TEXT NULL, \"CreatedAtUtc\" TEXT NOT NULL);");
            dbContext.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_CampaignMemberships_CampaignId_Email\" ON \"CampaignMemberships\" (\"CampaignId\", \"Email\");");

            EnsureColumnExists(dbContext, "CampaignMemberships", "UserId", "TEXT NULL");
            EnsureColumnExists(dbContext, "CampaignMemberships", "Email", "TEXT NOT NULL DEFAULT ''");
            EnsureColumnExists(dbContext, "CampaignMemberships", "Role", "TEXT NOT NULL DEFAULT 'Member'");
            EnsureColumnExists(dbContext, "CampaignMemberships", "Status", "TEXT NOT NULL DEFAULT 'Pending'");
            EnsureColumnExists(dbContext, "CampaignMemberships", "InvitedByUserId", "TEXT NULL");
            EnsureColumnExists(dbContext, "CampaignMemberships", "CreatedAtUtc", "TEXT NOT NULL DEFAULT ''");

            EnsureColumnExists(dbContext, "Campaigns", "OpenThreadsJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists(dbContext, "Campaigns", "WorldNotesJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists(dbContext, "Campaigns", "CampaignMapJson", "TEXT NOT NULL DEFAULT '{}'");
            EnsureColumnExists(dbContext, "Campaigns", "SessionsJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists(dbContext, "Campaigns", "NpcsJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists(dbContext, "Campaigns", "CampaignNpcsJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists(dbContext, "Campaigns", "LootJson", "TEXT NOT NULL DEFAULT '[]'");
            EnsureColumnExists(dbContext, "Campaigns", "Tone", "TEXT NOT NULL DEFAULT 'Heroic'");
            EnsureColumnExists(dbContext, "Campaigns", "LevelStart", "INTEGER NOT NULL DEFAULT 1");
            EnsureColumnExists(dbContext, "Campaigns", "LevelEnd", "INTEGER NOT NULL DEFAULT 4");
            EnsureColumnExists(dbContext, "Campaigns", "Hook", "TEXT NOT NULL DEFAULT ''");
            EnsureColumnExists(dbContext, "Campaigns", "NextSession", "TEXT NOT NULL DEFAULT ''");
            EnsureColumnExists(dbContext, "Campaigns", "Summary", "TEXT NOT NULL DEFAULT ''");
        }
        catch
        {
        }

        return true;
    }

    private static void EnsureColumnExists(DungeonKeepDbContext dbContext, string tableName, string columnName, string columnDefinition)
    {
        using var connection = dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
        }

        using var existsCommand = connection.CreateCommand();
        existsCommand.CommandText = $"SELECT 1 FROM pragma_table_info('{tableName}') WHERE name = '{columnName}' LIMIT 1;";
        if (existsCommand.ExecuteScalar() is not null)
        {
            return;
        }

#pragma warning disable EF1003
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE \"" + tableName + "\" ADD COLUMN \"" + columnName + "\" " + columnDefinition + ";");
#pragma warning restore EF1003
    }

    private static bool RequiresCampaignSchemaRepair(DbUpdateException exception)
    {
        var detail = exception.GetBaseException().Message;

        return detail.Contains("table Campaigns has no column named", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("table CampaignMemberships has no column named", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("no such table: CampaignMemberships", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<Campaign?> AddSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var sessions = ParseSessions(campaign.SessionsJson);
        sessions.Add(new PersistedCampaignSession(
            session.Id == Guid.Empty ? Guid.NewGuid() : session.Id,
            session.Title.Trim(),
            session.Date.Trim(),
            session.Location.Trim(),
            session.Objective.Trim(),
            NormalizeThreat(session.Threat)));

        campaign.SessionsJson = JsonSerializer.Serialize(sessions);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> UpdateSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var sessions = ParseSessions(campaign.SessionsJson);
        var updated = false;

        for (var index = 0; index < sessions.Count; index++)
        {
            if (sessions[index].Id != session.Id)
            {
                continue;
            }

            sessions[index] = sessions[index] with
            {
                Title = session.Title.Trim(),
                Date = session.Date.Trim(),
                Location = session.Location.Trim(),
                Objective = session.Objective.Trim(),
                Threat = NormalizeThreat(session.Threat)
            };
            updated = true;
            break;
        }

        if (!updated)
        {
            return null;
        }

        campaign.SessionsJson = JsonSerializer.Serialize(sessions);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> RemoveSessionAsync(Guid campaignId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var sessions = ParseSessions(campaign.SessionsJson);
        var updatedSessions = sessions.Where(session => session.Id != sessionId).ToList();
        if (updatedSessions.Count == sessions.Count)
        {
            return null;
        }

        campaign.SessionsJson = JsonSerializer.Serialize(updatedSessions);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> AddNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            if (!collection.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                collection.Add(name.Trim());
            }
        }, campaign => campaign.NpcsJson, (campaign, json) => campaign.NpcsJson = json, cancellationToken);
    }

    public async Task<Campaign?> SaveNpcAsync(Guid campaignId, CampaignNpcDto npc, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var normalizedNpc = NormalizeCampaignNpc(npc);
        var campaignNpcs = ParseCampaignNpcs(campaign.CampaignNpcsJson);
        var existingIndex = campaignNpcs.FindIndex(entry => entry.Id == normalizedNpc.Id);
        var previousName = existingIndex >= 0 ? campaignNpcs[existingIndex].Name : string.Empty;

        if (existingIndex >= 0)
        {
            campaignNpcs[existingIndex] = normalizedNpc;
        }
        else
        {
            campaignNpcs.Add(normalizedNpc);
        }

        campaign.CampaignNpcsJson = SerializeCampaignNpcs(campaignNpcs);

        var names = ParseNamedItems(campaign.NpcsJson);
        if (!string.IsNullOrWhiteSpace(previousName)
            && !string.Equals(previousName, normalizedNpc.Name, StringComparison.OrdinalIgnoreCase)
            && !campaignNpcs.Any(entry => string.Equals(entry.Name, previousName, StringComparison.OrdinalIgnoreCase)))
        {
            names.RemoveAll(item => string.Equals(item, previousName, StringComparison.OrdinalIgnoreCase));
        }

        if (!names.Contains(normalizedNpc.Name, StringComparer.OrdinalIgnoreCase))
        {
            names.Add(normalizedNpc.Name);
        }

        foreach (var campaignNpc in campaignNpcs)
        {
            if (!names.Contains(campaignNpc.Name, StringComparer.OrdinalIgnoreCase))
            {
                names.Add(campaignNpc.Name);
            }
        }

        campaign.NpcsJson = JsonSerializer.Serialize(names
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase));

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> RemoveNpcByIdAsync(Guid campaignId, Guid npcId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var campaignNpcs = ParseCampaignNpcs(campaign.CampaignNpcsJson);
        var removedNpc = campaignNpcs.FirstOrDefault(entry => entry.Id == npcId);
        if (removedNpc is null)
        {
            return null;
        }

        campaignNpcs.RemoveAll(entry => entry.Id == npcId);
        campaign.CampaignNpcsJson = SerializeCampaignNpcs(campaignNpcs);

        var names = ParseNamedItems(campaign.NpcsJson);
        names.RemoveAll(item => string.Equals(item, removedNpc.Name, StringComparison.OrdinalIgnoreCase));
        foreach (var campaignNpc in campaignNpcs)
        {
            if (!names.Contains(campaignNpc.Name, StringComparer.OrdinalIgnoreCase))
            {
                names.Add(campaignNpc.Name);
            }
        }

        campaign.NpcsJson = JsonSerializer.Serialize(names
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase));

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> RemoveNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var trimmedName = name.Trim();
        var names = ParseNamedItems(campaign.NpcsJson);
        names.RemoveAll(item => string.Equals(item, trimmedName, StringComparison.OrdinalIgnoreCase));
        campaign.NpcsJson = JsonSerializer.Serialize(names
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase));

        var campaignNpcs = ParseCampaignNpcs(campaign.CampaignNpcsJson)
            .Where(entry => !string.Equals(entry.Name, trimmedName, StringComparison.OrdinalIgnoreCase))
            .ToList();
        campaign.CampaignNpcsJson = SerializeCampaignNpcs(campaignNpcs);

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> AddLootAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            if (!collection.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                collection.Add(name.Trim());
            }
        }, campaign => campaign.LootJson, (campaign, json) => campaign.LootJson = json, cancellationToken);
    }

    public async Task<Campaign?> RemoveLootAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            collection.RemoveAll(item => string.Equals(item, name, StringComparison.OrdinalIgnoreCase));
        }, campaign => campaign.LootJson, (campaign, json) => campaign.LootJson = json, cancellationToken);
    }

    public async Task<Campaign?> AddThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var threads = ParseThreads(campaign.OpenThreadsJson);
        threads.Add(new PersistedCampaignThread(
            threadId == Guid.Empty ? Guid.NewGuid() : threadId,
            text.Trim(),
            NormalizeVisibility(visibility)));

        campaign.OpenThreadsJson = JsonSerializer.Serialize(threads);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> UpdateThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var threads = ParseThreads(campaign.OpenThreadsJson);
        var updated = false;

        for (var i = 0; i < threads.Count; i++)
        {
            var current = threads[i];
            if (current.Id != threadId)
            {
                continue;
            }

            threads[i] = current with
            {
                Text = text.Trim(),
                Visibility = NormalizeVisibility(visibility)
            };

            updated = true;
            break;
        }

        if (!updated)
        {
            return null;
        }

        campaign.OpenThreadsJson = JsonSerializer.Serialize(threads);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> ArchiveThreadAsync(Guid campaignId, Guid threadId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var threads = ParseThreads(campaign.OpenThreadsJson);
        var updatedThreads = threads
            .Where(item => item.Id != threadId)
            .ToList();

        if (updatedThreads.Count == threads.Count)
        {
            return null;
        }

        campaign.OpenThreadsJson = JsonSerializer.Serialize(updatedThreads);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> AddWorldNoteAsync(Guid campaignId, CampaignWorldNoteDto note, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var notes = ParseWorldNotes(campaign.WorldNotesJson);
        notes.Add(new PersistedCampaignWorldNote(
            note.Id == Guid.Empty ? Guid.NewGuid() : note.Id,
            note.Title.Trim(),
            NormalizeWorldNoteCategory(note.Category),
            note.Content.Trim()));

        campaign.WorldNotesJson = JsonSerializer.Serialize(notes);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> UpdateWorldNoteAsync(Guid campaignId, CampaignWorldNoteDto note, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var notes = ParseWorldNotes(campaign.WorldNotesJson);
        var updated = false;

        for (var index = 0; index < notes.Count; index++)
        {
            if (notes[index].Id != note.Id)
            {
                continue;
            }

            notes[index] = notes[index] with
            {
                Title = note.Title.Trim(),
                Category = NormalizeWorldNoteCategory(note.Category),
                Content = note.Content.Trim()
            };
            updated = true;
            break;
        }

        if (!updated)
        {
            return null;
        }

        campaign.WorldNotesJson = JsonSerializer.Serialize(notes);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> RemoveWorldNoteAsync(Guid campaignId, Guid noteId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var notes = ParseWorldNotes(campaign.WorldNotesJson);
        var updatedNotes = notes.Where(note => note.Id != noteId).ToList();
        if (updatedNotes.Count == notes.Count)
        {
            return null;
        }

        campaign.WorldNotesJson = JsonSerializer.Serialize(updatedNotes);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> UpdateMapAsync(Guid campaignId, CampaignMapLibraryDto library, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        campaign.CampaignMapJson = JsonSerializer.Serialize(NormalizeCampaignMapLibrary(library));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task RemoveCharacterAssignmentsFromMapsAsync(Guid characterId, IReadOnlyCollection<Guid>? campaignIds = null, CancellationToken cancellationToken = default)
    {
        if (characterId == Guid.Empty)
        {
            return;
        }

        var normalizedCampaignIds = (campaignIds ?? Array.Empty<Guid>())
            .Where(campaignId => campaignId != Guid.Empty)
            .Distinct()
            .ToArray();

        var query = dbContext.Campaigns.AsQueryable();
        if (normalizedCampaignIds.Length > 0)
        {
            query = query.Where(campaign => normalizedCampaignIds.Contains(campaign.Id));
        }

        var campaigns = await query.ToListAsync(cancellationToken);
        if (campaigns.Count == 0)
        {
            return;
        }

        var visionKey = $"character:{characterId}";
        var hasChanges = false;

        foreach (var campaign in campaigns)
        {
            var library = ParseCampaignMapLibrary(campaign.CampaignMapJson);
            var mapChanged = false;

            var updatedMaps = library.Maps
                .Select(map =>
                {
                    var tokenChanged = false;
                    var updatedTokens = map.Tokens
                        .Select(token =>
                        {
                            if (token.AssignedCharacterId != characterId)
                            {
                                return token;
                            }

                            tokenChanged = true;
                            return token with
                            {
                                AssignedCharacterId = null,
                                AssignedUserId = null
                            };
                        })
                        .ToList();

                    var existingVisionMemory = map.VisionMemory ?? [];
                    var updatedVisionMemory = existingVisionMemory
                        .Where(entry => !string.Equals(entry.Key, visionKey, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    if (!tokenChanged && updatedVisionMemory.Count == existingVisionMemory.Count)
                    {
                        return map;
                    }

                    mapChanged = true;
                    return map with
                    {
                        Tokens = updatedTokens,
                        VisionMemory = updatedVisionMemory
                    };
                })
                .ToList();

            if (!mapChanged)
            {
                continue;
            }

            campaign.CampaignMapJson = JsonSerializer.Serialize(NormalizeCampaignMapLibrary(new CampaignMapLibraryDto(library.ActiveMapId, updatedMaps)));
            hasChanges = true;
        }

        if (hasChanges)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<Campaign?> InviteMemberAsync(Guid campaignId, string email, AuthenticatedUser user, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var campaign = await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var existing = campaign.Memberships.FirstOrDefault(membership => membership.Email == normalizedEmail);
        if (existing is not null)
        {
            return campaign;
        }

        var invitedUser = await dbContext.AppUsers.FirstOrDefaultAsync(appUser => appUser.Email == normalizedEmail, cancellationToken);

        dbContext.CampaignMemberships.Add(new CampaignMembership
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            UserId = invitedUser?.Id,
            Email = normalizedEmail,
            Role = "Member",
            Status = "Pending",
            InvitedByUserId = user.Id,
            CreatedAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<bool> IsActiveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.CampaignMemberships
            .AnyAsync(membership => membership.CampaignId == campaignId && membership.UserId == userId && membership.Status == "Active", cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var membership = await dbContext.CampaignMemberships
            .FirstOrDefaultAsync(
                entry => entry.CampaignId == campaignId && entry.UserId == userId && entry.Status == "Active",
                cancellationToken);

        if (membership is null)
        {
            return;
        }

        dbContext.CampaignMemberships.Remove(membership);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Campaign?> AcceptInviteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var membership = await dbContext.CampaignMemberships
            .FirstOrDefaultAsync(
                entry => entry.CampaignId == campaignId && entry.UserId == userId && entry.Status == "Pending",
                cancellationToken);

        if (membership is null)
        {
            return null;
        }

        membership.Status = "Active";
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<bool> DeclineInviteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var membership = await dbContext.CampaignMemberships
            .FirstOrDefaultAsync(
                entry => entry.CampaignId == campaignId && entry.UserId == userId && entry.Status == "Pending",
                cancellationToken);

        if (membership is null)
        {
            return false;
        }

        dbContext.CampaignMemberships.Remove(membership);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task DeleteAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign is not null)
        {
            dbContext.Campaigns.Remove(campaign);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static CampaignMapLibraryDto ParseCampaignMapLibrary(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [DefaultCampaignMapBoard]);
        }

        try
        {
            var library = JsonSerializer.Deserialize<CampaignMapLibraryDto>(json);
            if (library is not null)
            {
                return NormalizeCampaignMapLibrary(library);
            }
        }
        catch
        {
        }

        try
        {
            var legacyMap = JsonSerializer.Deserialize<CampaignMapDto>(json);
            if (legacyMap is not null)
            {
                return NormalizeCampaignMapLibrary(new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [new CampaignMapBoardDto(
                    DefaultCampaignMapBoard.Id,
                    DefaultCampaignMapBoard.Name,
                    legacyMap.Background,
                    legacyMap.BackgroundImageUrl,
                    legacyMap.GridColumns,
                    legacyMap.GridRows,
                    legacyMap.GridColor,
                    legacyMap.GridOffsetX,
                    legacyMap.GridOffsetY,
                    legacyMap.Strokes,
                    legacyMap.Walls,
                    legacyMap.Icons,
                    legacyMap.Tokens,
                    legacyMap.Decorations,
                    legacyMap.Labels,
                    legacyMap.Layers,
                    legacyMap.VisionMemory)]));
            }
        }
        catch
        {
        }

        return new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [DefaultCampaignMapBoard]);
    }

    private static List<CampaignNpcDto> ParseCampaignNpcs(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            var npcs = JsonSerializer.Deserialize<List<CampaignNpcDto>>(json);
            if (npcs is not null)
            {
                return npcs
                    .Select(NormalizeCampaignNpc)
                    .Where(npc => !string.IsNullOrWhiteSpace(npc.Name))
                    .GroupBy(npc => npc.Id)
                    .Select(group => group.OrderByDescending(npc => npc.UpdatedAt, StringComparer.Ordinal).First())
                    .ToList();
            }
        }
        catch
        {
        }

        return [];
    }

    private static string SerializeCampaignNpcs(IEnumerable<CampaignNpcDto> npcs)
    {
        return JsonSerializer.Serialize(npcs
            .Select(NormalizeCampaignNpc)
            .Where(npc => !string.IsNullOrWhiteSpace(npc.Name))
            .DistinctBy(npc => npc.Id)
            .OrderByDescending(npc => npc.UpdatedAt, StringComparer.Ordinal));
    }

    private static CampaignNpcDto NormalizeCampaignNpc(CampaignNpcDto npc)
    {
        var npcId = npc.Id == Guid.Empty ? Guid.NewGuid() : npc.Id;
        var normalizedUpdatedAt = string.IsNullOrWhiteSpace(npc.UpdatedAt)
            ? DateTime.UtcNow.ToString("O")
            : npc.UpdatedAt.Trim();

        return new CampaignNpcDto(
            npcId,
            npc.Name.Trim(),
            npc.Title.Trim(),
            npc.Race.Trim(),
            npc.ClassOrRole.Trim(),
            npc.Faction.Trim(),
            npc.Occupation.Trim(),
            npc.Age.Trim(),
            npc.Gender.Trim(),
            npc.Alignment.Trim(),
            npc.CurrentStatus.Trim(),
            npc.Location.Trim(),
            npc.ShortDescription.Trim(),
            npc.Appearance.Trim(),
            NormalizeStringList(npc.PersonalityTraits),
            NormalizeStringList(npc.Ideals),
            NormalizeStringList(npc.Bonds),
            NormalizeStringList(npc.Flaws),
            npc.Motivations.Trim(),
            npc.Goals.Trim(),
            npc.Fears.Trim(),
            NormalizeStringList(npc.Secrets),
            NormalizeStringList(npc.Mannerisms),
            npc.VoiceNotes.Trim(),
            npc.Backstory.Trim(),
            npc.Notes.Trim(),
            npc.CombatNotes.Trim(),
            npc.StatBlockReference.Trim(),
            NormalizeStringList(npc.Tags),
            NormalizeRelationships(npc.Relationships),
            NormalizeStringList(npc.QuestLinks),
            NormalizeStringList(npc.SessionAppearances),
            NormalizeStringList(npc.Inventory),
            npc.ImageUrl.Trim(),
            NormalizeHostility(npc.Hostility),
            npc.IsAlive,
            npc.IsImportant,
            normalizedUpdatedAt
        );
    }

    private static IReadOnlyList<CampaignNpcRelationshipDto> NormalizeRelationships(IReadOnlyList<CampaignNpcRelationshipDto>? relationships)
    {
        return (relationships ?? [])
            .Select(relationship => new CampaignNpcRelationshipDto(
                relationship.Id == Guid.Empty ? Guid.NewGuid() : relationship.Id,
                relationship.TargetNpcId,
                relationship.RelationshipType.Trim(),
                relationship.Description.Trim()))
            .ToList();
    }

    private static IReadOnlyList<string> NormalizeStringList(IReadOnlyList<string>? values)
    {
        return (values ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .ToList();
    }

    private static string NormalizeHostility(string? hostility)
    {
        return hostility?.Trim() switch
        {
            "Friendly" => "Friendly",
            "Hostile" => "Hostile",
            _ => "Indifferent"
        };
    }

    private static List<PersistedCampaignThread> ParseThreads(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            var threads = JsonSerializer.Deserialize<List<PersistedCampaignThread>>(json);
            if (threads is { Count: > 0 })
            {
                return threads
                    .Where(thread => !string.IsNullOrWhiteSpace(thread.Text))
                    .Select(thread => new PersistedCampaignThread(
                        thread.Id == Guid.Empty ? Guid.NewGuid() : thread.Id,
                        thread.Text.Trim(),
                        NormalizeVisibility(thread.Visibility)))
                    .ToList();
            }

            var legacyThreads = JsonSerializer.Deserialize<List<string>>(json) ?? [];
            return legacyThreads
                .Where(thread => !string.IsNullOrWhiteSpace(thread))
                .Select(thread => new PersistedCampaignThread(Guid.NewGuid(), thread.Trim(), "Party"))
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static List<PersistedCampaignWorldNote> ParseWorldNotes(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<List<PersistedCampaignWorldNote>>(json) ?? [])
                .Where(note => !string.IsNullOrWhiteSpace(note.Title) && !string.IsNullOrWhiteSpace(note.Content))
                .Select(note => new PersistedCampaignWorldNote(
                    note.Id == Guid.Empty ? Guid.NewGuid() : note.Id,
                    note.Title.Trim(),
                    NormalizeWorldNoteCategory(note.Category),
                    note.Content.Trim()))
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static CampaignMapDto NormalizeCampaignMap(CampaignMapDto map)
    {
        return new CampaignMapDto(
            NormalizeMapBackground(map.Background),
            string.IsNullOrWhiteSpace(map.BackgroundImageUrl) ? string.Empty : map.BackgroundImageUrl.Trim(),
            NormalizeMapGridCount(map.GridColumns, DefaultMapGridColumns),
            NormalizeMapGridCount(map.GridRows, DefaultMapGridRows),
            NormalizeMapGridColor(map.GridColor, map.Background),
            NormalizeMapGridOffset(map.GridOffsetX, DefaultMapGridOffsetX),
            NormalizeMapGridOffset(map.GridOffsetY, DefaultMapGridOffsetY),
            (map.Strokes ?? [])
                .Where(stroke => stroke.Points is { Count: > 0 })
                .Select(stroke => new CampaignMapStrokeDto(
                    stroke.Id == Guid.Empty ? Guid.NewGuid() : stroke.Id,
                    NormalizeMapColor(stroke.Color),
                    Math.Clamp(stroke.Width, 2, 18),
                    stroke.Points
                        .Select(point => new CampaignMapPointDto(ClampMapCoordinate(point.X), ClampMapCoordinate(point.Y)))
                        .Distinct()
                        .ToList()))
                .Where(stroke => stroke.Points.Count > 0)
                .ToList(),
            NormalizeMapWallCollection(map.Walls),
            (map.Icons ?? [])
                .Select(icon => new CampaignMapIconDto(
                    icon.Id == Guid.Empty ? Guid.NewGuid() : icon.Id,
                    NormalizeMapIconType(icon.Type),
                    string.IsNullOrWhiteSpace(icon.Label) ? DefaultMapIconLabel(icon.Type) : icon.Label.Trim(),
                    ClampMapCoordinate(icon.X),
                    ClampMapCoordinate(icon.Y)))
                .ToList(),
            (map.Tokens ?? [])
                .Where(token => !string.IsNullOrWhiteSpace(token.ImageUrl))
                .Select(token => new CampaignMapTokenDto(
                    token.Id == Guid.Empty ? Guid.NewGuid() : token.Id,
                    string.IsNullOrWhiteSpace(token.Name) ? "Token" : token.Name.Trim(),
                    token.ImageUrl.Trim(),
                    ClampMapCoordinate(token.X),
                    ClampMapCoordinate(token.Y),
                    NormalizeMapTokenSize(token.Size),
                    token.Note?.Trim() ?? string.Empty,
                    NormalizeMapAssignedUserId(token.AssignedUserId, token.AssignedCharacterId),
                    NormalizeMapAssignedCharacterId(token.AssignedCharacterId),
                    NormalizeMapTokenMoveRevision(token.MoveRevision)))
                .ToList(),
            (map.Decorations ?? [])
                .Select(decoration => new CampaignMapDecorationDto(
                    decoration.Id == Guid.Empty ? Guid.NewGuid() : decoration.Id,
                    NormalizeMapDecorationType(decoration.Type),
                    NormalizeMapDecorationColor(decoration.Type, decoration.Color),
                    ClampMapCoordinate(decoration.X),
                    ClampMapCoordinate(decoration.Y),
                    ClampMapScale(decoration.Scale),
                    ClampMapRotation(decoration.Rotation),
                    ClampMapOpacity(decoration.Opacity)))
                .ToList(),
            (map.Labels ?? [])
                .Where(label => !string.IsNullOrWhiteSpace(label.Text))
                .Select(label => new CampaignMapLabelDto(
                    label.Id == Guid.Empty ? Guid.NewGuid() : label.Id,
                    label.Text.Trim(),
                    NormalizeMapLabelTone(label.Tone),
                    ClampMapCoordinate(label.X),
                    ClampMapCoordinate(label.Y),
                    ClampMapRotation(label.Rotation),
                    NormalizeMapLabelStyle(label.Style, label.Tone)))
                .ToList(),
            new CampaignMapLayersDto(
                NormalizeMapStrokeCollection(map.Layers?.Rivers),
                NormalizeMapDecorationCollection(map.Layers?.MountainChains),
                NormalizeMapDecorationCollection(map.Layers?.ForestBelts)),
            [],
            map.VisionEnabled);
    }

    private static CampaignMapBoardDto NormalizeCampaignMapBoard(CampaignMapBoardDto map)
    {
        var normalized = NormalizeCampaignMap(new CampaignMapDto(
            map.Background,
            map.BackgroundImageUrl,
            map.GridColumns,
            map.GridRows,
            map.GridColor,
            map.GridOffsetX,
            map.GridOffsetY,
            map.Strokes,
            map.Walls,
            map.Icons,
            map.Tokens,
            map.Decorations,
            map.Labels,
            map.Layers,
            map.VisionMemory,
            map.VisionEnabled));

        return new CampaignMapBoardDto(
            map.Id == Guid.Empty ? Guid.NewGuid() : map.Id,
            string.IsNullOrWhiteSpace(map.Name) ? "Untitled Map" : map.Name.Trim(),
            normalized.Background,
            normalized.BackgroundImageUrl,
            normalized.GridColumns,
            normalized.GridRows,
            normalized.GridColor,
            normalized.GridOffsetX,
            normalized.GridOffsetY,
            normalized.Strokes,
            normalized.Walls,
            normalized.Icons,
            normalized.Tokens,
            normalized.Decorations,
            normalized.Labels,
            normalized.Layers,
            normalized.VisionMemory,
            map.VisionEnabled);
    }

    private static CampaignMapLibraryDto NormalizeCampaignMapLibrary(CampaignMapLibraryDto library)
    {
        var maps = (library.Maps ?? [])
            .Select(NormalizeCampaignMapBoard)
            .DistinctBy(map => map.Id)
            .ToList();

        if (maps.Count == 0)
        {
            maps.Add(new CampaignMapBoardDto(Guid.NewGuid(), "Main Map", "Parchment", string.Empty, DefaultMapGridColumns, DefaultMapGridRows, DefaultMapGridColor, DefaultMapGridOffsetX, DefaultMapGridOffsetY, [], [], [], [], [], [], new CampaignMapLayersDto([], [], []), []));
        }

        var activeMapId = library.ActiveMapId != Guid.Empty && maps.Any(map => map.Id == library.ActiveMapId)
            ? library.ActiveMapId
            : maps[0].Id;

        return new CampaignMapLibraryDto(activeMapId, maps);
    }

    private static Guid? NormalizeMapAssignedUserId(Guid? assignedUserId, Guid? assignedCharacterId)
    {
        if (assignedCharacterId is Guid characterId && characterId != Guid.Empty)
        {
            return null;
        }

        return assignedUserId is Guid userId && userId != Guid.Empty ? userId : null;
    }

    private static Guid? NormalizeMapAssignedCharacterId(Guid? assignedCharacterId)
    {
        return assignedCharacterId is Guid characterId && characterId != Guid.Empty ? characterId : null;
    }

    private static IReadOnlyList<CampaignMapStrokeDto> NormalizeMapStrokeCollection(IReadOnlyList<CampaignMapStrokeDto>? strokes)
    {
        return (strokes ?? [])
            .Where(stroke => stroke.Points is { Count: > 0 })
            .Select(stroke => new CampaignMapStrokeDto(
                stroke.Id == Guid.Empty ? Guid.NewGuid() : stroke.Id,
                NormalizeMapColor(stroke.Color),
                Math.Clamp(stroke.Width, 2, 18),
                stroke.Points
                    .Select(point => new CampaignMapPointDto(ClampMapCoordinate(point.X), ClampMapCoordinate(point.Y)))
                    .Distinct()
                    .ToList()))
            .Where(stroke => stroke.Points.Count > 0)
            .ToList();
    }

    private static IReadOnlyList<CampaignMapWallDto> NormalizeMapWallCollection(IReadOnlyList<CampaignMapWallDto>? walls)
    {
        return (walls ?? [])
            .Where(wall => wall.Points is { Count: > 0 })
            .Select(wall => new CampaignMapWallDto(
                wall.Id == Guid.Empty ? Guid.NewGuid() : wall.Id,
                NormalizeMapColor(wall.Color),
                Math.Clamp(wall.Width, 2, 18),
                wall.Points
                    .Select(point => new CampaignMapPointDto(ClampMapCoordinate(point.X), ClampMapCoordinate(point.Y)))
                    .Distinct()
                    .ToList(),
                wall.BlocksVision ?? true,
                wall.BlocksMovement ?? true))
            .Where(wall => wall.Points.Count > 0)
            .ToList();
    }

    private static IReadOnlyList<CampaignMapDecorationDto> NormalizeMapDecorationCollection(IReadOnlyList<CampaignMapDecorationDto>? decorations)
    {
        return (decorations ?? [])
            .Select(decoration => new CampaignMapDecorationDto(
                decoration.Id == Guid.Empty ? Guid.NewGuid() : decoration.Id,
                NormalizeMapDecorationType(decoration.Type),
                NormalizeMapDecorationColor(decoration.Type, decoration.Color),
                ClampMapCoordinate(decoration.X),
                ClampMapCoordinate(decoration.Y),
                ClampMapScale(decoration.Scale),
                ClampMapRotation(decoration.Rotation),
                ClampMapOpacity(decoration.Opacity)))
            .ToList();
    }

    private async Task<Campaign?> UpdateNamedCollectionAsync(
        Guid campaignId,
        Action<List<string>> updateAction,
        Func<Campaign, string> readJson,
        Action<Campaign, string> writeJson,
        CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var items = ParseNamedItems(readJson(campaign));
        updateAction(items);
        writeJson(campaign, JsonSerializer.Serialize(items));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    private static List<PersistedCampaignSession> ParseSessions(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<List<PersistedCampaignSession>>(json) ?? [])
                .Where(session => !string.IsNullOrWhiteSpace(session.Title))
                .Select(session => new PersistedCampaignSession(
                    session.Id == Guid.Empty ? Guid.NewGuid() : session.Id,
                    session.Title.Trim(),
                    session.Date.Trim(),
                    session.Location.Trim(),
                    session.Objective.Trim(),
                    NormalizeThreat(session.Threat)))
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static List<string> ParseNamedItems(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<List<string>>(json) ?? [])
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static string NormalizeThreat(string? threat)
    {
        return threat?.Trim() switch
        {
            "Low" => "Low",
            "Moderate" => "Moderate",
            "High" => "High",
            "Deadly" => "Deadly",
            _ => "Moderate"
        };
    }

    private static string NormalizeVisibility(string? visibility)
    {
        if (string.Equals(visibility, "GMOnly", StringComparison.OrdinalIgnoreCase))
        {
            return "GMOnly";
        }

        return "Party";
    }

    private static string NormalizeWorldNoteCategory(string? category)
    {
        return category?.Trim() switch
        {
            "Backstory" => "Backstory",
            "Organization" => "Organization",
            "Ally" => "Ally",
            "Enemy" => "Enemy",
            "Location" => "Location",
            "Lore" => "Lore",
            "Custom" => "Custom",
            _ => "Lore"
        };
    }

    private static string NormalizeMapBackground(string? background)
    {
        return background?.Trim() switch
        {
            "Cavern" => "Cavern",
            "Coast" => "Coast",
            "City" => "City",
            "Battlemap" => "Battlemap",
            _ => "Parchment"
        };
    }

    private static string NormalizeMapColor(string? color)
    {
        return color?.Trim() switch
        {
            "#4b3a2a" => "#4b3a2a",
            "#8a5a2b" => "#8a5a2b",
            "#507255" => "#507255",
            "#385f7a" => "#385f7a",
            "#a03d2f" => "#a03d2f",
            _ => "#8a5a2b"
        };
    }

    private static string NormalizeMapDecorationColor(string? decorationType, string? color)
    {
        return color?.Trim() switch
        {
            "#4b3a2a" => "#4b3a2a",
            "#8a5a2b" => "#8a5a2b",
            "#507255" => "#507255",
            "#385f7a" => "#385f7a",
            "#a03d2f" => "#a03d2f",
            _ => NormalizeMapDecorationType(decorationType) switch
            {
                "Mountain" => "#4b3a2a",
                "Forest" => "#507255",
                "Reef" => "#385f7a",
                "Ward" => "#a03d2f",
                _ => "#8a5a2b"
            }
        };
    }

    private static string NormalizeMapIconType(string? iconType)
    {
        return iconType?.Trim() switch
        {
            "Town" => "Town",
            "Camp" => "Camp",
            "Dungeon" => "Dungeon",
            "Danger" => "Danger",
            "Treasure" => "Treasure",
            "Portal" => "Portal",
            "Tower" => "Tower",
            _ => "Keep"
        };
    }

    private static string NormalizeMapDecorationType(string? decorationType)
    {
        return decorationType?.Trim() switch
        {
            "Mountain" => "Mountain",
            "Hill" => "Hill",
            "Reef" => "Reef",
            "Cave" => "Cave",
            "Ward" => "Ward",
            _ => "Forest"
        };
    }

    private static string NormalizeMapLabelTone(string? tone)
    {
        return tone?.Trim() switch
        {
            "Feature" => "Feature",
            _ => "Region"
        };
    }

    private static CampaignMapLabelStyleDto NormalizeMapLabelStyle(CampaignMapLabelStyleDto? style, string? tone)
    {
        var normalizedTone = NormalizeMapLabelTone(tone);
        var defaults = DefaultMapLabelStyle(normalizedTone);

        return new CampaignMapLabelStyleDto(
            NormalizeMapLabelColor(style?.Color, normalizedTone),
            NormalizeMapLabelCssColor(style?.BackgroundColor, defaults.BackgroundColor),
            NormalizeMapLabelCssColor(style?.BorderColor, defaults.BorderColor),
            NormalizeMapLabelFontFamily(style?.FontFamily, normalizedTone),
            ClampMapLabelFontSize(style?.FontSize ?? defaults.FontSize, normalizedTone),
            ClampMapLabelFontWeight(style?.FontWeight ?? defaults.FontWeight, normalizedTone),
            ClampMapLabelLetterSpacing(style?.LetterSpacing ?? defaults.LetterSpacing, normalizedTone),
            NormalizeMapLabelFontStyle(style?.FontStyle, defaults.FontStyle),
            NormalizeMapLabelTextTransform(style?.TextTransform, defaults.TextTransform),
            ClampMapLabelBorderWidth(style?.BorderWidth ?? defaults.BorderWidth, normalizedTone),
            ClampMapLabelBorderRadius(style?.BorderRadius ?? defaults.BorderRadius, normalizedTone),
            ClampMapLabelPaddingX(style?.PaddingX ?? defaults.PaddingX, normalizedTone),
            ClampMapLabelPaddingY(style?.PaddingY ?? defaults.PaddingY, normalizedTone),
            NormalizeMapLabelCssEffect(style?.TextShadow, defaults.TextShadow),
            NormalizeMapLabelCssEffect(style?.BoxShadow, defaults.BoxShadow),
            ClampMapLabelOpacity(style?.Opacity ?? defaults.Opacity, normalizedTone));
    }

    private static string DefaultMapIconLabel(string? iconType)
    {
        return NormalizeMapIconType(iconType) switch
        {
            "Town" => "Town",
            "Camp" => "Camp",
            "Dungeon" => "Dungeon",
            "Danger" => "Hazard",
            "Treasure" => "Cache",
            "Portal" => "Gate",
            "Tower" => "Tower",
            _ => "Keep"
        };
    }

    private static double ClampMapCoordinate(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0.5d;
        }

        return Math.Clamp(value, 0d, 1d);
    }

    private static double ClampMapScale(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 1d;
        }

        return Math.Clamp(value, 0.55d, 1.8d);
    }

    private static double NormalizeMapTokenSize(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 1d;
        }

        double[] tokenSizes = [0.5d, 1d, 2d, 4d];
        return tokenSizes.Aggregate((closest, size) => Math.Abs(size - value) < Math.Abs(closest - value) ? size : closest);
    }

    private static long NormalizeMapTokenMoveRevision(long value)
    {
        return Math.Max(0L, value);
    }

    private static double NormalizeMapGridCount(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value) || value <= 0d)
        {
            return fallback;
        }

        return Math.Clamp(Math.Round(value * 2d, MidpointRounding.AwayFromZero) / 2d, 8d, 60d);
    }

    private static string NormalizeMapGridColor(string? value, string? background)
    {
        var trimmed = value?.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(trimmed) && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^#[0-9a-f]{6}$"))
        {
            return trimmed;
        }

        return DefaultGridColorForBackground(background);
    }

    private static double NormalizeMapGridOffset(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(Math.Round(value * 20d, MidpointRounding.AwayFromZero) / 20d, -1d, 1d);
    }

    private static string DefaultGridColorForBackground(string? background)
    {
        return NormalizeMapBackground(background) switch
        {
            "Coast" => "#3f667e",
            "City" => "#594532",
            "Cavern" => "#4a5f3e",
            "Battlemap" => "#584f43",
            _ => DefaultMapGridColor
        };
    }

    private static double ClampMapRotation(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0d;
        }

        return Math.Clamp(value, -180d, 180d);
    }

    private static double ClampMapOpacity(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0.75d;
        }

        return Math.Clamp(value, 0.24d, 1d);
    }

    private static CampaignMapLabelStyleDto DefaultMapLabelStyle(string tone)
    {
        return tone == "Feature"
            ? new CampaignMapLabelStyleDto("#f6ead8", "transparent", "transparent", "body", 0.84d, 600, 0.08d, "italic", "none", 0d, 8d, 0d, 0d, "0 1px 0 rgba(43, 28, 19, 0.72), 0 2px 10px rgba(0, 0, 0, 0.34)", "none", 0.98d)
            : new CampaignMapLabelStyleDto("#fff4e5", "transparent", "transparent", "display", 1d, 650, 0.18d, "normal", "uppercase", 0d, 8d, 0d, 0d, "0 1px 0 rgba(43, 28, 19, 0.78), 0 2px 12px rgba(0, 0, 0, 0.4)", "none", 1d);
    }

    private static string NormalizeMapLabelColor(string? color, string tone)
    {
        return NormalizeMapLabelCssColor(color, DefaultMapLabelStyle(tone).Color);
    }

    private static string NormalizeMapLabelCssColor(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return !string.IsNullOrWhiteSpace(trimmed) && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^(transparent|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\\([\\d\\s.,%]+\\)|hsla?\\([\\d\\s.,%]+\\))$")
            ? trimmed
            : fallback;
    }

    private static string NormalizeMapLabelFontFamily(string? fontFamily, string tone)
    {
        return string.Equals(fontFamily?.Trim(), "body", StringComparison.OrdinalIgnoreCase)
            ? "body"
            : DefaultMapLabelStyle(tone).FontFamily;
    }

    private static string NormalizeMapLabelFontStyle(string? fontStyle, string fallback)
    {
        return string.Equals(fontStyle?.Trim(), "italic", StringComparison.OrdinalIgnoreCase) ? "italic" : fallback;
    }

    private static string NormalizeMapLabelTextTransform(string? textTransform, string fallback)
    {
        return string.Equals(textTransform?.Trim(), "none", StringComparison.OrdinalIgnoreCase) ? "none" : fallback;
    }

    private static double ClampMapLabelBorderWidth(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).BorderWidth;
        }

        return Math.Clamp(value, 0d, 6d);
    }

    private static double ClampMapLabelBorderRadius(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).BorderRadius;
        }

        return Math.Clamp(value, 0d, 32d);
    }

    private static double ClampMapLabelPaddingX(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).PaddingX;
        }

        return Math.Clamp(value, 0d, 24d);
    }

    private static double ClampMapLabelPaddingY(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).PaddingY;
        }

        return Math.Clamp(value, 0d, 16d);
    }

    private static string NormalizeMapLabelCssEffect(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return !string.IsNullOrWhiteSpace(trimmed) && trimmed.Length <= 120 && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^(none|[a-zA-Z0-9#(),.%\\s+-]+)$")
            ? trimmed
            : fallback;
    }

    private static double ClampMapLabelFontSize(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).FontSize;
        }

        return Math.Clamp(value, 0.72d, 2.4d);
    }

    private static int ClampMapLabelFontWeight(int value, string tone)
    {
        if (value <= 0)
        {
            return DefaultMapLabelStyle(tone).FontWeight;
        }

        return Math.Clamp((int)Math.Round(value / 50d) * 50, 400, 800);
    }

    private static double ClampMapLabelLetterSpacing(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).LetterSpacing;
        }

        return Math.Clamp(value, -0.04d, 0.32d);
    }

    private static double ClampMapLabelOpacity(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).Opacity;
        }

        return Math.Clamp(value, 0.45d, 1d);
    }

    private sealed record PersistedCampaignThread(Guid Id, string Text, string Visibility);
    private sealed record PersistedCampaignWorldNote(Guid Id, string Title, string Category, string Content);
    private sealed record PersistedCampaignSession(Guid Id, string Title, string Date, string Location, string Objective, string Threat);
}
