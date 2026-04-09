using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class CharacterRepository(DungeonKeepDbContext dbContext) : ICharacterRepository
{
    public async Task<IReadOnlyList<Character>> GetAccessibleByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .Include(c => c.CampaignAssignments)
            .Where(c => c.OwnerUserId == userId
                || c.CampaignAssignments.Any(assignment => assignment.Campaign != null
                    && assignment.Campaign.Memberships.Any(membership => membership.UserId == userId && membership.Status == "Active")))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid characterId, CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return false;
        }
        dbContext.Characters.Remove(character);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
    public async Task<IReadOnlyList<Character>> GetByCampaignIdAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .Include(c => c.CampaignAssignments)
            .Where(c => c.CampaignAssignments.Any(assignment => assignment.CampaignId == campaignId))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Character>> GetUnassignedOwnedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .Include(c => c.CampaignAssignments)
            .Where(c => c.OwnerUserId == userId && !c.CampaignAssignments.Any())
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Character> AddAsync(Character character, CancellationToken cancellationToken = default)
    {
        SyncCampaignAssignments(character, character.CampaignAssignments.Select(assignment => assignment.CampaignId));
        dbContext.Characters.Add(character);
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Collection(c => c.CampaignAssignments).LoadAsync(cancellationToken);
        return character;
    }

    public async Task<Character?> GetByIdAsync(Guid characterId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .Include(c => c.CampaignAssignments)
            .FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
    }

    public async Task<Character?> UpdateAsync(
        Guid characterId,
        string name,
        string playerName,
        string className,
        int level,
        string background,
        string notes,
        IReadOnlyCollection<Guid> campaignIds,
        int hitPoints,
        int deathSaveFailures,
        int deathSaveSuccesses,
        int armorClass,
        string species,
        string alignment,
        string lifestyle,
        string personalityTraits,
        string ideals,
        string bonds,
        string flaws,
        string equipment,
        string abilityScores,
        string skills,
        string savingThrows,
        string combatStats,
        string spells,
        int experiencePoints,
        string portraitUrl,
        string goals,
        string secrets,
        string sessionHistory,
        CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return null;
        }

        character.Name = name;
        character.PlayerName = playerName;
        character.ClassName = className;
        character.Level = level;
        character.Background = background;
        character.Notes = notes;
        SyncCampaignAssignments(character, campaignIds);
        character.HitPoints = Math.Max(0, hitPoints);
        character.DeathSaveFailures = Math.Clamp(deathSaveFailures, 0, 3);
        character.DeathSaveSuccesses = Math.Clamp(deathSaveSuccesses, 0, 3);
        character.ArmorClass = Math.Max(0, armorClass);
        character.Species = species;
        character.Alignment = alignment;
        character.Lifestyle = lifestyle;
        character.PersonalityTraits = personalityTraits;
        character.Ideals = ideals;
        character.Bonds = bonds;
        character.Flaws = flaws;
        character.Equipment = equipment;
        character.AbilityScores = abilityScores;
        character.Skills = skills;
        character.SavingThrows = savingThrows;
        character.CombatStats = combatStats;
        character.Spells = spells;
        character.ExperiencePoints = Math.Max(0, experiencePoints);
        character.PortraitUrl = portraitUrl;
        character.Goals = goals;
        character.Secrets = secrets;
        character.SessionHistory = sessionHistory;

        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        await dbContext.Entry(character).Collection(c => c.CampaignAssignments).LoadAsync(cancellationToken);
        return character;
    }

    public async Task<Character?> UpdateCampaignAsync(Guid characterId, IReadOnlyCollection<Guid> campaignIds, CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters
            .Include(c => c.CampaignAssignments)
            .FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return null;
        }

        SyncCampaignAssignments(character, campaignIds);
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        await dbContext.Entry(character).Collection(c => c.CampaignAssignments).LoadAsync(cancellationToken);
        return character;
    }

    public async Task UnassignOwnedByUserInCampaignAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var characters = await dbContext.Characters
            .Include(character => character.CampaignAssignments)
            .Where(character => character.OwnerUserId == userId && character.CampaignAssignments.Any(assignment => assignment.CampaignId == campaignId))
            .ToListAsync(cancellationToken);

        if (characters.Count == 0)
        {
            return;
        }

        foreach (var character in characters)
        {
            var assignmentToRemove = character.CampaignAssignments
                .Where(assignment => assignment.CampaignId == campaignId)
                .ToList();

            foreach (var assignment in assignmentToRemove)
            {
                dbContext.CharacterCampaignAssignments.Remove(assignment);
            }

            var remainingCampaignIds = character.CampaignAssignments
                .Where(assignment => assignment.CampaignId != campaignId)
                .Select(assignment => assignment.CampaignId)
                .ToList();

            character.CampaignId = ResolvePrimaryCampaignId(remainingCampaignIds);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Character?> UpdateBackstoryAsync(Guid characterId, string backstory, CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return null;
        }

        character.Backstory = backstory;
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        return character;
    }

    public async Task<Character?> UpdateStatusAsync(Guid characterId, string status, CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return null;
        }

        character.Status = status;
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        return character;
    }

    public async Task<Character?> PromoteAsync(Guid characterId, CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return null;
        }

        character.Level = Math.Min(20, character.Level + 1);
        character.Status = "Ready";
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        return character;
    }

    private static void SyncCampaignAssignments(Character character, IEnumerable<Guid> campaignIds)
    {
        var normalizedCampaignIds = NormalizeCampaignIds(campaignIds);
        var currentAssignments = character.CampaignAssignments ?? [];
        var assignmentsByCampaignId = currentAssignments.ToDictionary(assignment => assignment.CampaignId, assignment => assignment);

        foreach (var staleAssignment in currentAssignments.Where(assignment => !normalizedCampaignIds.Contains(assignment.CampaignId)).ToList())
        {
            currentAssignments.Remove(staleAssignment);
        }

        foreach (var campaignId in normalizedCampaignIds)
        {
            if (assignmentsByCampaignId.ContainsKey(campaignId))
            {
                continue;
            }

            currentAssignments.Add(new CharacterCampaignAssignment
            {
                CharacterId = character.Id,
                CampaignId = campaignId
            });
        }

        character.CampaignAssignments = currentAssignments;
        character.CampaignId = ResolvePrimaryCampaignId(normalizedCampaignIds);
    }

    private static List<Guid> NormalizeCampaignIds(IEnumerable<Guid> campaignIds)
    {
        return campaignIds
            .Where(campaignId => campaignId != Guid.Empty)
            .Distinct()
            .ToList();
    }

    private static Guid? ResolvePrimaryCampaignId(IReadOnlyList<Guid> campaignIds)
    {
        return campaignIds.Count > 0 ? campaignIds[0] : null;
    }
}
