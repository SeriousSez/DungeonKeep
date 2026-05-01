using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICampaignRepository
{
    Task<IReadOnlyList<CampaignSummaryRecord>> GetAllSummariesForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Campaign>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Campaign> AddAsync(Campaign campaign, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateAsync(Guid campaignId, string name, string setting, string tone, int levelStart, int levelEnd, string hook, string nextSession, string summary, CancellationToken cancellationToken = default);
    Task<Campaign?> AddSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default);
    Task<Campaign?> RemoveSessionAsync(Guid campaignId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<Campaign?> AddNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default);
    Task<Campaign?> SaveNpcAsync(Guid campaignId, CampaignNpcDto npc, CancellationToken cancellationToken = default);
    Task<Campaign?> RemoveNpcByIdAsync(Guid campaignId, Guid npcId, CancellationToken cancellationToken = default);
    Task<Campaign?> RemoveNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default);
    Task<Campaign?> AddLootAsync(Guid campaignId, string name, Guid? sessionId, CancellationToken cancellationToken = default);
    Task<Campaign?> RemoveLootAsync(Guid campaignId, string name, CancellationToken cancellationToken = default);
    Task<Campaign?> AddThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default);
    Task<Campaign?> ArchiveThreadAsync(Guid campaignId, Guid threadId, CancellationToken cancellationToken = default);
    Task<Campaign?> AddWorldNoteAsync(Guid campaignId, CampaignWorldNoteDto note, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateWorldNoteAsync(Guid campaignId, CampaignWorldNoteDto note, CancellationToken cancellationToken = default);
    Task<Campaign?> RemoveWorldNoteAsync(Guid campaignId, Guid noteId, CancellationToken cancellationToken = default);
    Task<Campaign?> SetSessionVisibilityAsync(Guid campaignId, Guid sessionId, bool isRevealedToPlayers, CancellationToken cancellationToken = default);
    Task<Campaign?> SetWorldNoteVisibilityAsync(Guid campaignId, Guid noteId, bool isRevealedToPlayers, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateMapAsync(Guid campaignId, CampaignMapLibraryDto library, CancellationToken cancellationToken = default);
    Task RemoveCharacterAssignmentsFromMapsAsync(Guid characterId, IReadOnlyCollection<Guid>? campaignIds = null, CancellationToken cancellationToken = default);
    Task<Campaign?> InviteMemberAsync(Guid campaignId, string email, AuthenticatedUser user, CancellationToken cancellationToken = default);
    Task<Campaign?> AcceptInviteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeclineInviteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsActiveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task RemoveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid campaignId, CancellationToken cancellationToken = default);
    Task<Campaign?> SaveSessionDetailsAsync(Guid campaignId, Guid sessionId, string? detailsJson, string? lootAssignmentsJson, CancellationToken cancellationToken = default);
    Task<Campaign?> SaveCustomTablesAsync(Guid campaignId, string tablesJson, CancellationToken cancellationToken = default);
}
