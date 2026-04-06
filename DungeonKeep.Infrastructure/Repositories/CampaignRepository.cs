using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class CampaignRepository(DungeonKeepDbContext dbContext) : ICampaignRepository
{
    private readonly bool campaignSchemaReady = EnsureCampaignSchema(dbContext);

    public async Task<IReadOnlyList<Campaign>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        return await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.Characters)
                .ThenInclude(character => character.OwnerUser)
            .Where(c => c.Memberships.Any(membership => membership.UserId == userId && membership.Status == "Active"))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        return await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.Characters)
                .ThenInclude(character => character.OwnerUser)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Campaign> AddAsync(Campaign campaign, CancellationToken cancellationToken = default)
    {
        _ = campaignSchemaReady;
        dbContext.Campaigns.Add(campaign);
        await dbContext.SaveChangesAsync(cancellationToken);
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
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }

            using var existsCommand = connection.CreateCommand();
            existsCommand.CommandText = "SELECT 1 FROM pragma_table_info('Campaigns') WHERE name = 'CampaignMapJson' LIMIT 1;";
            if (existsCommand.ExecuteScalar() is not null)
            {
                return true;
            }

            dbContext.Database.ExecuteSqlRaw("ALTER TABLE \"Campaigns\" ADD COLUMN \"CampaignMapJson\" TEXT NOT NULL DEFAULT '{}';");
        }
        catch
        {
        }

        return true;
    }

    public async Task<Campaign?> AddSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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

    public async Task<Campaign?> RemoveNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            collection.RemoveAll(item => string.Equals(item, name, StringComparison.OrdinalIgnoreCase));
        }, campaign => campaign.NpcsJson, (campaign, json) => campaign.NpcsJson = json, cancellationToken);
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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        campaign.CampaignMapJson = JsonSerializer.Serialize(NormalizeCampaignMapLibrary(library));
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> InviteMemberAsync(Guid campaignId, string email, AuthenticatedUser user, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var campaign = await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.Characters)
                .ThenInclude(character => character.OwnerUser)
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
            Status = invitedUser is null ? "Pending" : "Active",
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

    public async Task DeleteAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign is not null)
        {
            dbContext.Campaigns.Remove(campaign);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
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
            (map.Icons ?? [])
                .Select(icon => new CampaignMapIconDto(
                    icon.Id == Guid.Empty ? Guid.NewGuid() : icon.Id,
                    NormalizeMapIconType(icon.Type),
                    string.IsNullOrWhiteSpace(icon.Label) ? DefaultMapIconLabel(icon.Type) : icon.Label.Trim(),
                    ClampMapCoordinate(icon.X),
                    ClampMapCoordinate(icon.Y)))
                .ToList(),
            (map.Decorations ?? [])
                .Select(decoration => new CampaignMapDecorationDto(
                    decoration.Id == Guid.Empty ? Guid.NewGuid() : decoration.Id,
                    NormalizeMapDecorationType(decoration.Type),
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
                    ClampMapRotation(label.Rotation)))
                .ToList(),
            new CampaignMapLayersDto(
                NormalizeMapStrokeCollection(map.Layers?.Rivers),
                NormalizeMapDecorationCollection(map.Layers?.MountainChains),
                NormalizeMapDecorationCollection(map.Layers?.ForestBelts)));
    }

    private static CampaignMapBoardDto NormalizeCampaignMapBoard(CampaignMapBoardDto map)
    {
        var normalized = NormalizeCampaignMap(new CampaignMapDto(
            map.Background,
            map.BackgroundImageUrl,
            map.Strokes,
            map.Icons,
            map.Decorations,
            map.Labels,
            map.Layers));

        return new CampaignMapBoardDto(
            map.Id == Guid.Empty ? Guid.NewGuid() : map.Id,
            string.IsNullOrWhiteSpace(map.Name) ? "Untitled Map" : map.Name.Trim(),
            normalized.Background,
            normalized.BackgroundImageUrl,
            normalized.Strokes,
            normalized.Icons,
            normalized.Decorations,
            normalized.Labels,
            normalized.Layers);
    }

    private static CampaignMapLibraryDto NormalizeCampaignMapLibrary(CampaignMapLibraryDto library)
    {
        var maps = (library.Maps ?? [])
            .Select(NormalizeCampaignMapBoard)
            .DistinctBy(map => map.Id)
            .ToList();

        if (maps.Count == 0)
        {
            maps.Add(new CampaignMapBoardDto(Guid.NewGuid(), "Main Map", "Parchment", string.Empty, [], [], [], [], new CampaignMapLayersDto([], [], [])));
        }

        var activeMapId = library.ActiveMapId != Guid.Empty && maps.Any(map => map.Id == library.ActiveMapId)
            ? library.ActiveMapId
            : maps[0].Id;

        return new CampaignMapLibraryDto(activeMapId, maps);
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

    private static IReadOnlyList<CampaignMapDecorationDto> NormalizeMapDecorationCollection(IReadOnlyList<CampaignMapDecorationDto>? decorations)
    {
        return (decorations ?? [])
            .Select(decoration => new CampaignMapDecorationDto(
                decoration.Id == Guid.Empty ? Guid.NewGuid() : decoration.Id,
                NormalizeMapDecorationType(decoration.Type),
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
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var items = ParseNamedItems(readJson(campaign));
        updateAction(items);
        writeJson(campaign, JsonSerializer.Serialize(items));
        await dbContext.SaveChangesAsync(cancellationToken);
        return campaign;
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

    private sealed record PersistedCampaignThread(Guid Id, string Text, string Visibility);
    private sealed record PersistedCampaignWorldNote(Guid Id, string Title, string Category, string Content);
    private sealed record PersistedCampaignSession(Guid Id, string Title, string Date, string Location, string Objective, string Threat);
}
