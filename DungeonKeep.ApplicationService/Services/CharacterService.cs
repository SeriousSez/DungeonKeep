using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Services;

public sealed class CharacterService(ICampaignRepository campaignRepository, ICharacterRepository characterRepository, IBackstoryGenerator backstoryGenerator) : ICharacterService
{
    public async Task<IReadOnlyList<CharacterDto>> GetByCampaignAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var isMember = await campaignRepository.IsActiveMemberAsync(campaignId, userId, cancellationToken);
        if (!isMember)
        {
            throw new UnauthorizedAccessException("You are not a member of this campaign.");
        }

        var characters = await characterRepository.GetByCampaignIdAsync(campaignId, cancellationToken);
        return characters
            .Select(character => MapCharacter(character, userId))
            .ToList();
    }

    public async Task<CharacterDto> CreateAsync(Guid campaignId, CreateCharacterRequest request, AuthenticatedUser user, CancellationToken cancellationToken = default)
    {
        var isMember = await campaignRepository.IsActiveMemberAsync(campaignId, user.Id, cancellationToken);
        if (!isMember)
        {
            throw new UnauthorizedAccessException("You are not a member of this campaign.");
        }

        if (await campaignRepository.GetByIdAsync(campaignId, cancellationToken) is null)
        {
            throw new InvalidOperationException("Campaign not found.");
        }

        var character = new Character
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            OwnerUserId = user.Id,
            Name = request.Name.Trim(),
            PlayerName = request.PlayerName.Trim(),
            ClassName = request.ClassName.Trim(),
            Level = Math.Max(1, request.Level),
            Status = "Ready",
            Background = request.Background.Trim(),
            Notes = request.Notes.Trim(),
            Backstory = string.Empty,
            CreatedAtUtc = DateTime.UtcNow
        };

        var saved = await characterRepository.AddAsync(character, cancellationToken);
        return MapCharacter(saved, user.Id);
    }

    public async Task<GenerateCharacterBackstoryResponse> GenerateBackstoryAsync(GenerateCharacterBackstoryRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        _ = userId;

        var normalizedRequest = new GenerateCharacterBackstoryRequest(
            NormalizeText(request.ClassName, "Unknown class"),
            NormalizeText(request.Background, "Unknown background"),
            NormalizeText(request.Species, "Unknown species"),
            NormalizeText(request.Alignment, "Unchosen alignment"),
            NormalizeText(request.Lifestyle, "Unchosen lifestyle"),
            NormalizeCollection(request.PersonalityTraits),
            NormalizeCollection(request.Ideals),
            NormalizeCollection(request.Bonds),
            NormalizeCollection(request.Flaws),
            request.AdditionalDirection?.Trim() ?? string.Empty
        );

        var backstory = await backstoryGenerator.GenerateAsync(normalizedRequest, cancellationToken);
        return new GenerateCharacterBackstoryResponse(backstory);
    }

    public async Task<CharacterDto?> UpdateBackstoryAsync(Guid characterId, UpdateCharacterBackstoryRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (existing.OwnerUserId != userId)
        {
            throw new UnauthorizedAccessException("Only the character owner can edit this backstory.");
        }

        var updated = await characterRepository.UpdateBackstoryAsync(characterId, request.Backstory.Trim(), cancellationToken);
        if (updated is null)
        {
            return null;
        }

        return MapCharacter(updated, userId);
    }

    public async Task<CharacterDto?> UpdateStatusAsync(Guid characterId, UpdateCharacterStatusRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var status = request.Status.Trim();
        if (status is not ("Ready" or "Resting" or "Recovering"))
        {
            return null;
        }

        var existing = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (existing.OwnerUserId != userId)
        {
            throw new UnauthorizedAccessException("Only the character owner can change status.");
        }

        var updated = await characterRepository.UpdateStatusAsync(characterId, status, cancellationToken);
        return updated is null ? null : MapCharacter(updated, userId);
    }

    public async Task<CharacterDto?> PromoteAsync(Guid characterId, Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (existing.OwnerUserId != userId)
        {
            throw new UnauthorizedAccessException("Only the character owner can level up this character.");
        }

        var updated = await characterRepository.PromoteAsync(characterId, cancellationToken);
        return updated is null ? null : MapCharacter(updated, userId);
    }

    private static CharacterDto MapCharacter(Character character, Guid currentUserId)
    {
        return new CharacterDto(
            character.Id,
            character.CampaignId,
            character.OwnerUserId,
            character.OwnerUser?.DisplayName ?? character.PlayerName,
            character.Name,
            character.PlayerName,
            character.ClassName,
            character.Level,
            character.Status,
            character.Background,
            character.Notes,
            character.Backstory,
            character.CreatedAtUtc,
            character.OwnerUserId == currentUserId
        );
    }

    private static string NormalizeText(string? value, string fallback)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? fallback : normalized;
    }

    private static string[] NormalizeCollection(string[]? values)
    {
        return values?
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToArray()
            ?? [];
    }
}
