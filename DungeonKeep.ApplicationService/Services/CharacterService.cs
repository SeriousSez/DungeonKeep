using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Services;

public sealed class CharacterService(ICampaignRepository campaignRepository, ICharacterRepository characterRepository, IBackstoryGenerator backstoryGenerator, ICharacterPortraitGenerator characterPortraitGenerator) : ICharacterService
{
    public async Task<IReadOnlyList<CharacterDto>> GetAccessibleAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var characters = await characterRepository.GetAccessibleByUserIdAsync(userId, cancellationToken);
        return characters
            .Select(character => MapCharacter(character, userId))
            .ToList();
    }

    public async Task<bool> DeleteAsync(Guid characterId, Guid userId, CancellationToken cancellationToken = default)
    {
        var character = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (character is null)
        {
            return false;
        }
        if (character.OwnerUserId != userId)
        {
            throw new UnauthorizedAccessException("Only the character owner can delete this character.");
        }
        return await characterRepository.DeleteAsync(characterId, cancellationToken);
    }
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

    public async Task<IReadOnlyList<CharacterDto>> GetUnassignedOwnedAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var characters = await characterRepository.GetUnassignedOwnedByUserIdAsync(userId, cancellationToken);
        return characters
            .Select(character => MapCharacter(character, userId))
            .ToList();
    }

    public async Task<CharacterDto> CreateAsync(Guid? campaignId, CreateCharacterRequest request, AuthenticatedUser user, CancellationToken cancellationToken = default)
    {
        var normalizedCampaignIds = NormalizeCampaignIds(request.CampaignIds, campaignId ?? request.CampaignId);
        await ValidateCampaignIdsAsync(normalizedCampaignIds, user.Id, cancellationToken);
        var primaryCampaignId = normalizedCampaignIds.FirstOrDefault();

        var character = new Character
        {
            Id = Guid.NewGuid(),
            CampaignId = primaryCampaignId == Guid.Empty ? null : primaryCampaignId,
            OwnerUserId = user.Id,
            Name = request.Name.Trim(),
            PlayerName = request.PlayerName.Trim(),
            ClassName = request.ClassName.Trim(),
            Level = Math.Max(1, request.Level),
            Status = "Ready",
            Background = request.Background.Trim(),
            Notes = request.Notes.Trim(),
            Backstory = string.Empty,
            Species = request.Species.Trim(),
            Alignment = request.Alignment.Trim(),
            Lifestyle = request.Lifestyle.Trim(),
            PersonalityTraits = request.PersonalityTraits.Trim(),
            Ideals = request.Ideals.Trim(),
            Bonds = request.Bonds.Trim(),
            Flaws = request.Flaws.Trim(),
            Equipment = request.Equipment.Trim(),
            AbilityScores = request.AbilityScores.Trim(),
            Skills = request.Skills.Trim(),
            SavingThrows = request.SavingThrows.Trim(),
            HitPoints = Math.Max(0, request.HitPoints),
            DeathSaveFailures = Math.Clamp(request.DeathSaveFailures, 0, 3),
            DeathSaveSuccesses = Math.Clamp(request.DeathSaveSuccesses, 0, 3),
            ArmorClass = Math.Max(0, request.ArmorClass),
            CombatStats = request.CombatStats.Trim(),
            Spells = request.Spells.Trim(),
            ExperiencePoints = Math.Max(0, request.ExperiencePoints),
            PortraitUrl = request.PortraitUrl.Trim(),
            DetailBackgroundImageUrl = request.DetailBackgroundImageUrl.Trim(),
            Goals = request.Goals.Trim(),
            Secrets = request.Secrets.Trim(),
            SessionHistory = request.SessionHistory.Trim(),
            CampaignAssignments = normalizedCampaignIds.Select(selectedCampaignId => new CharacterCampaignAssignment
            {
                CharacterId = Guid.NewGuid(),
                CampaignId = selectedCampaignId
            }).ToList(),
            CreatedAtUtc = DateTime.UtcNow
        };

        foreach (var assignment in character.CampaignAssignments)
        {
            assignment.CharacterId = character.Id;
        }

        var saved = await characterRepository.AddAsync(character, cancellationToken);
        return MapCharacter(saved, user.Id);
    }

    public async Task<CharacterDto?> UpdateAsync(Guid characterId, UpdateCharacterRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        if (existing.OwnerUserId != userId)
        {
            throw new UnauthorizedAccessException("Only the character owner can edit this character.");
        }

        var normalizedCampaignIds = NormalizeCampaignIds(request.CampaignIds, request.CampaignId);
        await ValidateCampaignIdsAsync(normalizedCampaignIds, userId, cancellationToken);

        var updated = await characterRepository.UpdateAsync(
            characterId,
            request.Name.Trim(),
            request.PlayerName.Trim(),
            request.ClassName.Trim(),
            Math.Max(1, request.Level),
            request.Background.Trim(),
            request.Notes.Trim(),
            normalizedCampaignIds,
            request.HitPoints.HasValue ? Math.Max(0, request.HitPoints.Value) : existing.HitPoints,
            request.DeathSaveFailures.HasValue ? Math.Clamp(request.DeathSaveFailures.Value, 0, 3) : existing.DeathSaveFailures,
            request.DeathSaveSuccesses.HasValue ? Math.Clamp(request.DeathSaveSuccesses.Value, 0, 3) : existing.DeathSaveSuccesses,
            request.ArmorClass.HasValue ? Math.Max(0, request.ArmorClass.Value) : existing.ArmorClass,
            ResolveOptionalText(request.Species, existing.Species),
            ResolveOptionalText(request.Alignment, existing.Alignment),
            ResolveOptionalText(request.Lifestyle, existing.Lifestyle),
            ResolveOptionalText(request.PersonalityTraits, existing.PersonalityTraits),
            ResolveOptionalText(request.Ideals, existing.Ideals),
            ResolveOptionalText(request.Bonds, existing.Bonds),
            ResolveOptionalText(request.Flaws, existing.Flaws),
            ResolveOptionalText(request.Equipment, existing.Equipment),
            ResolveOptionalText(request.AbilityScores, existing.AbilityScores),
            ResolveOptionalText(request.Skills, existing.Skills),
            ResolveOptionalText(request.SavingThrows, existing.SavingThrows),
            ResolveOptionalText(request.CombatStats, existing.CombatStats),
            ResolveOptionalText(request.Spells, existing.Spells),
            request.ExperiencePoints.HasValue ? Math.Max(0, request.ExperiencePoints.Value) : existing.ExperiencePoints,
            ResolveOptionalText(request.PortraitUrl, existing.PortraitUrl),
            ResolveOptionalText(request.DetailBackgroundImageUrl, existing.DetailBackgroundImageUrl),
            ResolveOptionalText(request.Goals, existing.Goals),
            ResolveOptionalText(request.Secrets, existing.Secrets),
            ResolveOptionalText(request.SessionHistory, existing.SessionHistory),
            cancellationToken
        );

        return updated is null ? null : MapCharacter(updated, userId);
    }

    public async Task<CharacterDto?> UpdateCampaignAsync(Guid characterId, UpdateCharacterCampaignRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var existing = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        var canManageCharacter = existing.OwnerUserId == userId
            || await IsOwnerOfAnyCampaignAsync(ResolveCampaignIds(existing), userId, cancellationToken);

        if (!canManageCharacter)
        {
            throw new UnauthorizedAccessException("Only the character owner or a campaign owner can change campaign assignment.");
        }

        var normalizedCampaignIds = NormalizeCampaignIds(request.CampaignIds, request.CampaignId);
        await ValidateCampaignIdsAsync(normalizedCampaignIds, userId, cancellationToken);

        var updated = await characterRepository.UpdateCampaignAsync(characterId, normalizedCampaignIds, cancellationToken);
        return updated is null ? null : MapCharacter(updated, userId);
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

    public async Task<GenerateCharacterPortraitResponse> GeneratePortraitAsync(GenerateCharacterPortraitRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        _ = userId;

        var normalizedRequest = new GenerateCharacterPortraitRequest(
            NormalizeText(request.Name, "Unnamed adventurer"),
            NormalizeText(request.ClassName, "Unknown class"),
            NormalizeText(request.Background, "Unknown background"),
            NormalizeText(request.Species, "Unknown species"),
            NormalizeText(request.Alignment, "Unchosen alignment"),
            request.Gender?.Trim() ?? string.Empty,
            request.AdditionalDirection?.Trim() ?? string.Empty
        );

        var imageUrl = await characterPortraitGenerator.GenerateAsync(normalizedRequest, cancellationToken);
        return new GenerateCharacterPortraitResponse(imageUrl);
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
        if (status is not ("Ready" or "Resting" or "Recovering" or "Inactive"))
        {
            return null;
        }

        var existing = await characterRepository.GetByIdAsync(characterId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        var canManageCharacter = existing.OwnerUserId == userId
            || await IsOwnerOfAnyCampaignAsync(ResolveCampaignIds(existing), userId, cancellationToken);

        if (!canManageCharacter)
        {
            throw new UnauthorizedAccessException("Only the character owner or a campaign owner can change status.");
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

    private async Task<bool> IsOwnerOfAnyCampaignAsync(IEnumerable<Guid> campaignIds, Guid userId, CancellationToken cancellationToken)
    {
        foreach (var campaignId in campaignIds.Where(id => id != Guid.Empty).Distinct())
        {
            var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
            var membership = campaign?.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");

            if (membership?.Role == "Owner")
            {
                return true;
            }
        }

        return false;
    }

    private static CharacterDto MapCharacter(Character character, Guid currentUserId)
    {
        var campaignIds = ResolveCampaignIds(character).ToArray();

        return new CharacterDto(
            character.Id,
            character.CampaignId ?? Guid.Empty,
            campaignIds,
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
            character.OwnerUserId == currentUserId,
            character.Species,
            character.Alignment,
            character.Lifestyle,
            character.PersonalityTraits,
            character.Ideals,
            character.Bonds,
            character.Flaws,
            character.Equipment,
            character.AbilityScores,
            character.Skills,
            character.SavingThrows,
            character.HitPoints,
            character.DeathSaveFailures,
            character.DeathSaveSuccesses,
            character.ArmorClass,
            character.CombatStats,
            character.Spells,
            character.ExperiencePoints,
            character.PortraitUrl,
            character.DetailBackgroundImageUrl,
            character.Goals,
            character.Secrets,
            character.SessionHistory
        );
    }

    private async Task ValidateCampaignIdsAsync(IReadOnlyCollection<Guid> campaignIds, Guid userId, CancellationToken cancellationToken)
    {
        foreach (var campaignId in campaignIds)
        {
            var isMember = await campaignRepository.IsActiveMemberAsync(campaignId, userId, cancellationToken);
            if (!isMember)
            {
                throw new UnauthorizedAccessException("You are not a member of this campaign.");
            }

            if (await campaignRepository.GetByIdAsync(campaignId, cancellationToken) is null)
            {
                throw new InvalidOperationException("Campaign not found.");
            }
        }
    }

    private static IReadOnlyList<Guid> NormalizeCampaignIds(IEnumerable<Guid>? campaignIds, Guid? fallbackCampaignId = null)
    {
        var normalized = new List<Guid>();

        if (fallbackCampaignId is { } fallback && fallback != Guid.Empty)
        {
            normalized.Add(fallback);
        }

        if (campaignIds is not null)
        {
            foreach (var campaignId in campaignIds)
            {
                if (campaignId == Guid.Empty || normalized.Contains(campaignId))
                {
                    continue;
                }

                normalized.Add(campaignId);
            }
        }

        return normalized;
    }

    private static IReadOnlyList<Guid> ResolveCampaignIds(Character character)
    {
        var campaignIds = character.CampaignAssignments
            .Select(assignment => assignment.CampaignId)
            .Where(campaignId => campaignId != Guid.Empty)
            .Distinct()
            .ToList();

        if (character.CampaignId is { } primaryCampaignId && primaryCampaignId != Guid.Empty)
        {
            campaignIds.Remove(primaryCampaignId);
            campaignIds.Insert(0, primaryCampaignId);
        }

        return campaignIds;
    }

    private static Guid? NormalizeCampaignId(Guid? campaignId)
    {
        return campaignId is { } value && value != Guid.Empty ? value : null;
    }

    private static string NormalizeText(string? value, string fallback)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? fallback : normalized;
    }

    private static string ResolveOptionalText(string? incomingValue, string existingValue)
    {
        if (incomingValue is null)
        {
            return existingValue;
        }

        return incomingValue.Trim();
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
