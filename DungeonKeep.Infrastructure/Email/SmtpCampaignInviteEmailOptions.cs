using MailKit.Security;
using Microsoft.Extensions.Configuration;

namespace DungeonKeep.Infrastructure.Email;

public sealed class SmtpCampaignInviteEmailOptions
{
    public bool Enabled { get; init; }
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 587;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromAddress { get; init; } = string.Empty;
    public string FromName { get; init; } = "DungeonKeep";
    public string ReplyToAddress { get; init; } = string.Empty;
    public string ReplyToName { get; init; } = "DungeonKeep";
    public string SecureSocketOption { get; init; } = nameof(SecureSocketOptions.StartTlsWhenAvailable);

    public bool IsEnabled =>
        Enabled &&
        !string.IsNullOrWhiteSpace(Host) &&
        !string.IsNullOrWhiteSpace(FromAddress);

    public void Validate()
    {
        if (!Enabled)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(Host))
        {
            throw new InvalidOperationException("Email.Host is required when email delivery is enabled.");
        }

        if (Host.Contains('@'))
        {
            throw new InvalidOperationException("Email.Host must be an SMTP server hostname, not an email address.");
        }

        if (Port is < 1 or > 65535)
        {
            throw new InvalidOperationException("Email.Port must be between 1 and 65535.");
        }

        if (string.IsNullOrWhiteSpace(FromAddress))
        {
            throw new InvalidOperationException("Email.FromAddress is required when email delivery is enabled.");
        }
    }

    public SecureSocketOptions GetSecureSocketOptions()
    {
        return Enum.TryParse<SecureSocketOptions>(SecureSocketOption, ignoreCase: true, out var parsed)
            ? parsed
            : SecureSocketOptions.StartTlsWhenAvailable;
    }

    public static SmtpCampaignInviteEmailOptions FromConfiguration(IConfiguration configuration)
    {
        var emailSection = configuration.GetSection("Email");
        var port = emailSection.GetValue<int?>("Port") ?? 587;

        return new SmtpCampaignInviteEmailOptions
        {
            Enabled = emailSection.GetValue<bool?>("Enabled") ?? false,
            Host = emailSection["Host"] ?? string.Empty,
            Port = port,
            Username = emailSection["Username"] ?? string.Empty,
            Password = emailSection["Password"] ?? string.Empty,
            FromAddress = emailSection["FromAddress"] ?? string.Empty,
            FromName = emailSection["FromName"] ?? "DungeonKeep",
            ReplyToAddress = emailSection["ReplyToAddress"] ?? string.Empty,
            ReplyToName = emailSection["ReplyToName"] ?? "DungeonKeep",
            SecureSocketOption = emailSection["SecureSocketOption"] ?? nameof(SecureSocketOptions.StartTlsWhenAvailable)
        };
    }
}