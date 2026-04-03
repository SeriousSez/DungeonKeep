using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICampaignService
{
    Task<IReadOnlyList<CampaignDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto> CreateAsync(CreateCampaignRequest request, AuthenticatedUser owner, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateAsync(Guid campaignId, UpdateCampaignRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> AddThreadAsync(Guid campaignId, CreateCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> UpdateThreadAsync(Guid campaignId, Guid threadId, UpdateCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> ArchiveThreadAsync(Guid campaignId, ArchiveCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CampaignDto?> InviteMemberAsync(Guid campaignId, InviteCampaignMemberRequest request, AuthenticatedUser user, string? clientBaseUrl, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
}
