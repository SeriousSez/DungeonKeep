using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class CharacterRepository(DungeonKeepDbContext dbContext) : ICharacterRepository
{
    public async Task<IReadOnlyList<Character>> GetByCampaignIdAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .Where(c => c.CampaignId == campaignId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Character>> GetUnassignedOwnedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .Where(c => c.OwnerUserId == userId && c.CampaignId == null)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Character> AddAsync(Character character, CancellationToken cancellationToken = default)
    {
        dbContext.Characters.Add(character);
        await dbContext.SaveChangesAsync(cancellationToken);
        return character;
    }

    public async Task<Character?> GetByIdAsync(Guid characterId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Characters
            .Include(c => c.OwnerUser)
            .FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
    }

    public async Task<Character?> UpdateAsync(Guid characterId, string name, string playerName, string className, int level, string background, string notes, Guid? campaignId, CancellationToken cancellationToken = default)
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
        character.CampaignId = campaignId;

        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        return character;
    }

    public async Task<Character?> UpdateCampaignAsync(Guid characterId, Guid? campaignId, CancellationToken cancellationToken = default)
    {
        var character = await dbContext.Characters.FirstOrDefaultAsync(c => c.Id == characterId, cancellationToken);
        if (character is null)
        {
            return null;
        }

        character.CampaignId = campaignId;
        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(character).Reference(c => c.OwnerUser).LoadAsync(cancellationToken);
        return character;
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
}
