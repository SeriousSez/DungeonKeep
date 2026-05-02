using System.Collections.Concurrent;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DungeonKeep.API.Hubs;

public sealed class VoiceHub(IAuthService authService, ICampaignRepository campaignRepository) : Hub
{
    private static readonly ConcurrentDictionary<string, VoiceConnectionState> Connections = new(StringComparer.Ordinal);

    public async Task<VoiceJoinResult> JoinVoiceRoom(string campaignId, string mapId, string token)
    {
        if (!Guid.TryParse(campaignId, out var campaignGuid))
        {
            throw new HubException("Campaign id is invalid.");
        }

        if (string.IsNullOrWhiteSpace(mapId))
        {
            throw new HubException("Map id is required.");
        }

        var user = await authService.GetAuthenticatedUserByTokenAsync(token, Context.ConnectionAborted);
        if (user is null)
        {
            throw new HubException("Authentication required.");
        }

        var isMember = await campaignRepository.IsActiveMemberAsync(campaignGuid, user.Id, Context.ConnectionAborted);
        if (!isMember)
        {
            throw new HubException("Campaign access denied.");
        }

        var roomKey = BuildRoomKey(campaignId, mapId);
        await LeaveCurrentRoomIfNeeded();

        var connectionId = Context.ConnectionId;
        var state = new VoiceConnectionState(
            ConnectionId: connectionId,
            CampaignId: campaignId,
            MapId: mapId,
            UserId: user.Id.ToString(),
            DisplayName: string.IsNullOrWhiteSpace(user.DisplayName) ? "Player" : user.DisplayName,
            MicrophoneMuted: false
        );

        Connections[connectionId] = state;
        await Groups.AddToGroupAsync(connectionId, roomKey);

        var participants = GetRoomParticipants(campaignId, mapId);
        await Clients.GroupExcept(roomKey, [connectionId]).SendAsync("VoiceParticipantJoined", state.ToDto(), Context.ConnectionAborted);

        return new VoiceJoinResult(connectionId, participants);
    }

    public async Task LeaveVoiceRoom()
    {
        await LeaveCurrentRoomIfNeeded();
    }

    public async Task UpdateMicrophoneMuted(bool muted)
    {
        if (!Connections.TryGetValue(Context.ConnectionId, out var state))
        {
            return;
        }

        var nextState = state with { MicrophoneMuted = muted };
        Connections[Context.ConnectionId] = nextState;

        await Clients.GroupExcept(BuildRoomKey(nextState.CampaignId, nextState.MapId), [nextState.ConnectionId])
            .SendAsync("VoiceParticipantMicrophoneUpdated", new VoiceParticipantMicrophoneUpdated(nextState.ConnectionId, muted), Context.ConnectionAborted);
    }

    public async Task SendVoiceOffer(string targetConnectionId, string sdp)
    {
        if (string.IsNullOrWhiteSpace(targetConnectionId) || string.IsNullOrWhiteSpace(sdp))
        {
            return;
        }

        if (!CanRelayToTarget(targetConnectionId, out var callerState) || callerState is null)
        {
            return;
        }

        await Clients.Client(targetConnectionId).SendAsync(
            "VoiceOfferReceived",
            new VoiceOfferPayload(callerState.ConnectionId, sdp),
            Context.ConnectionAborted
        );
    }

    public async Task SendVoiceAnswer(string targetConnectionId, string sdp)
    {
        if (string.IsNullOrWhiteSpace(targetConnectionId) || string.IsNullOrWhiteSpace(sdp))
        {
            return;
        }

        if (!CanRelayToTarget(targetConnectionId, out var callerState) || callerState is null)
        {
            return;
        }

        await Clients.Client(targetConnectionId).SendAsync(
            "VoiceAnswerReceived",
            new VoiceAnswerPayload(callerState.ConnectionId, sdp),
            Context.ConnectionAborted
        );
    }

    public async Task SendVoiceIceCandidate(string targetConnectionId, string candidate, string? sdpMid, int? sdpMLineIndex)
    {
        if (string.IsNullOrWhiteSpace(targetConnectionId) || string.IsNullOrWhiteSpace(candidate))
        {
            return;
        }

        if (!CanRelayToTarget(targetConnectionId, out var callerState) || callerState is null)
        {
            return;
        }

        await Clients.Client(targetConnectionId).SendAsync(
            "VoiceIceCandidateReceived",
            new VoiceIceCandidatePayload(callerState.ConnectionId, candidate, sdpMid, sdpMLineIndex),
            Context.ConnectionAborted
        );
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await LeaveCurrentRoomIfNeeded();
        await base.OnDisconnectedAsync(exception);
    }

    private bool CanRelayToTarget(string targetConnectionId, out VoiceConnectionState? callerState)
    {
        callerState = null;

        if (!Connections.TryGetValue(Context.ConnectionId, out callerState))
        {
            return false;
        }

        if (!Connections.TryGetValue(targetConnectionId, out var targetState))
        {
            return false;
        }

        return callerState.CampaignId == targetState.CampaignId
            && callerState.MapId == targetState.MapId;
    }

    private async Task LeaveCurrentRoomIfNeeded()
    {
        if (!Connections.TryRemove(Context.ConnectionId, out var state))
        {
            return;
        }

        var roomKey = BuildRoomKey(state.CampaignId, state.MapId);
        try
        {
            await Groups.RemoveFromGroupAsync(state.ConnectionId, roomKey);
        }
        catch
        {
            // Ignore leave failures during reconnect or disconnect.
        }

        await Clients.Group(roomKey).SendAsync("VoiceParticipantLeft", new VoiceParticipantLeft(state.ConnectionId), Context.ConnectionAborted);
    }

    private static IReadOnlyList<VoiceParticipantDto> GetRoomParticipants(string campaignId, string mapId)
    {
        return Connections.Values
            .Where(entry => entry.CampaignId == campaignId && entry.MapId == mapId)
            .Select(entry => entry.ToDto())
            .OrderBy(entry => entry.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string BuildRoomKey(string campaignId, string mapId) => $"voice-{campaignId}-{mapId}";

    private sealed record VoiceConnectionState(
        string ConnectionId,
        string CampaignId,
        string MapId,
        string UserId,
        string DisplayName,
        bool MicrophoneMuted)
    {
        public VoiceParticipantDto ToDto() => new(ConnectionId, UserId, DisplayName, MicrophoneMuted);
    }

    public sealed record VoiceParticipantDto(string ConnectionId, string UserId, string DisplayName, bool MicrophoneMuted);
    public sealed record VoiceJoinResult(string ConnectionId, IReadOnlyList<VoiceParticipantDto> Participants);
    public sealed record VoiceParticipantLeft(string ConnectionId);
    public sealed record VoiceParticipantMicrophoneUpdated(string ConnectionId, bool MicrophoneMuted);
    public sealed record VoiceOfferPayload(string FromConnectionId, string Sdp);
    public sealed record VoiceAnswerPayload(string FromConnectionId, string Sdp);
    public sealed record VoiceIceCandidatePayload(string FromConnectionId, string Candidate, string? SdpMid, int? SdpMLineIndex);
}
