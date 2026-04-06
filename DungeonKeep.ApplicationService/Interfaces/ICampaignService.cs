using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICampaignService
{
    Task<IReadOnlyList<CampaignDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto> CreateAsync(CreateCampaignRequest request, AuthenticatedUser owner, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateAsync(Guid campaignId, UpdateCampaignRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> AddSessionAsync(Guid campaignId, CreateCampaignSessionRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateSessionAsync(Guid campaignId, Guid sessionId, UpdateCampaignSessionRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> RemoveSessionAsync(Guid campaignId, Guid sessionId, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> AddNpcAsync(Guid campaignId, CreateCampaignNpcRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> RemoveNpcAsync(Guid campaignId, RemoveCampaignNpcRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> AddLootAsync(Guid campaignId, CreateCampaignLootRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> RemoveLootAsync(Guid campaignId, RemoveCampaignLootRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> AddThreadAsync(Guid campaignId, CreateCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateThreadAsync(Guid campaignId, Guid threadId, UpdateCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> ArchiveThreadAsync(Guid campaignId, ArchiveCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> AddWorldNoteAsync(Guid campaignId, CreateCampaignWorldNoteRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateWorldNoteAsync(Guid campaignId, Guid noteId, UpdateCampaignWorldNoteRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> DeleteWorldNoteAsync(Guid campaignId, DeleteCampaignWorldNoteRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateMapAsync(Guid campaignId, UpdateCampaignMapRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> InviteMemberAsync(Guid campaignId, InviteCampaignMemberRequest request, AuthenticatedUser user, string? clientBaseUrl, CancellationToken cancellationToken = default);
    Task LeaveAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
}
