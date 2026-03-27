using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using System.Text.Json;

namespace DungeonKeep.ApplicationService.Services;

public sealed class CampaignService(ICampaignRepository campaignRepository) : ICampaignService
{
    private static readonly string[] DefaultOpenThreads = ["Define the inciting incident for the first session."];

    public async Task<IReadOnlyList<CampaignDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var campaigns = await campaignRepository.GetAllForUserAsync(userId, cancellationToken);
        return campaigns
            .Select(campaign => MapCampaign(campaign, userId))
            .ToList();
    }

    public async Task<CampaignDto> CreateAsync(CreateCampaignRequest request, AuthenticatedUser owner, CancellationToken cancellationToken = default)
    {
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Setting = request.Setting.Trim(),
            Summary = request.Summary.Trim(),
            OpenThreadsJson = JsonSerializer.Serialize(DefaultOpenThreads),
            CreatedAtUtc = DateTime.UtcNow,
            Memberships =
            [
                new CampaignMembership
                {
                    Id = Guid.NewGuid(),
                    UserId = owner.Id,
                    Email = owner.Email,
                    Role = "Owner",
                    Status = "Active",
                    CreatedAtUtc = DateTime.UtcNow
                }
            ]
        };

        var saved = await campaignRepository.AddAsync(campaign, cancellationToken);
        return MapCampaign(saved, owner.Id);
    }

    public async Task<CampaignDto?> ArchiveThreadAsync(Guid campaignId, ArchiveCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Thread))
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can archive threads.");
        }

        var updated = await campaignRepository.ArchiveThreadAsync(campaignId, request.Thread.Trim(), cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> InviteMemberAsync(Guid campaignId, InviteCampaignMemberRequest request, AuthenticatedUser user, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == user.Id && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can invite members.");
        }

        var updated = await campaignRepository.InviteMemberAsync(campaignId, request.Email.Trim(), user, cancellationToken);
        return updated is null ? null : MapCampaign(updated, user.Id);
    }

    private static CampaignDto MapCampaign(Campaign campaign, Guid userId)
    {
        var currentUserRole = campaign.Memberships
            .FirstOrDefault(member => member.UserId == userId && member.Status == "Active")
            ?.Role ?? "Member";

        return new CampaignDto(
            campaign.Id,
            campaign.Name,
            campaign.Setting,
            campaign.Summary,
            campaign.CreatedAtUtc,
            campaign.Characters.Count,
            ParseOpenThreads(campaign.OpenThreadsJson),
            currentUserRole,
            campaign.Memberships
                .OrderBy(member => member.Status == "Active" ? 0 : 1)
                .ThenBy(member => member.Role == "Owner" ? 0 : 1)
                .ThenBy(member => member.DisplayLabel())
                .Select(member => new CampaignMemberDto(
                    member.UserId,
                    member.Email,
                    member.DisplayLabel(),
                    member.Role,
                    member.Status
                ))
                .ToList()
        );
    }

    private static IReadOnlyList<string> ParseOpenThreads(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return DefaultOpenThreads;
        }

        try
        {
            var threads = JsonSerializer.Deserialize<List<string>>(json) ?? [];
            return threads;
        }
        catch
        {
            return DefaultOpenThreads;
        }
    }
}

file static class CampaignMembershipExtensions
{
    public static string DisplayLabel(this CampaignMembership membership)
    {
        return string.IsNullOrWhiteSpace(membership.User?.DisplayName)
            ? membership.Email
            : membership.User.DisplayName;
    }
}
