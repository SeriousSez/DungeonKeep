using DungeonKeep.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DungeonKeep.Infrastructure.Persistence;

public sealed class DungeonKeepDbContext(DbContextOptions<DungeonKeepDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<AuthSession> AuthSessions => Set<AuthSession>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<CampaignMembership> CampaignMemberships => Set<CampaignMembership>();
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<CharacterCampaignAssignment> CharacterCampaignAssignments => Set<CharacterCampaignAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(320).IsRequired();
            entity.Property(user => user.DisplayName).HasMaxLength(120).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(2048).IsRequired();
            entity.Property(user => user.IsEmailVerified).IsRequired();
            entity.Property(user => user.ActivationCodeHash).HasMaxLength(256).IsRequired();
            entity.Property(user => user.ActivationCodeExpiresAtUtc);
            entity.Property(user => user.CreatedAtUtc).IsRequired();

            entity.HasIndex(user => user.Email).IsUnique();
        });

        modelBuilder.Entity<AuthSession>(entity =>
        {
            entity.HasKey(session => session.Id);
            entity.Property(session => session.Token).HasMaxLength(256).IsRequired();
            entity.Property(session => session.CreatedAtUtc).IsRequired();
            entity.Property(session => session.ExpiresAtUtc).IsRequired();

            entity.HasIndex(session => session.Token).IsUnique();

            entity.HasOne(session => session.User)
                .WithMany(user => user.Sessions)
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(120).IsRequired();
            entity.Property(c => c.Setting).HasMaxLength(120);
            entity.Property(c => c.Tone).HasMaxLength(32).IsRequired();
            entity.Property(c => c.LevelStart).IsRequired();
            entity.Property(c => c.LevelEnd).IsRequired();
            entity.Property(c => c.Hook).HasMaxLength(500);
            entity.Property(c => c.NextSession).HasMaxLength(120);
            entity.Property(c => c.Summary).HasMaxLength(1000);
            entity.Property(c => c.SessionsJson).HasColumnType("longtext").IsRequired();
            entity.Property(c => c.NpcsJson).HasColumnType("longtext").IsRequired();
            entity.Property(c => c.LootJson).HasColumnType("longtext").IsRequired();
            entity.Property(c => c.OpenThreadsJson).HasColumnType("longtext").IsRequired();
            entity.Property(c => c.WorldNotesJson).HasColumnType("longtext").IsRequired();
            entity.Property(c => c.CampaignMapJson).HasColumnType("longtext").IsRequired();
            entity.Property(c => c.CreatedAtUtc).IsRequired();

            entity.HasMany(c => c.Characters)
                .WithOne(c => c.Campaign)
                .HasForeignKey(c => c.CampaignId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(c => c.Memberships)
                .WithOne(membership => membership.Campaign)
                .HasForeignKey(membership => membership.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CampaignMembership>(entity =>
        {
            entity.HasKey(membership => membership.Id);
            entity.Property(membership => membership.Email).HasMaxLength(320).IsRequired();
            entity.Property(membership => membership.Role).HasMaxLength(32).IsRequired();
            entity.Property(membership => membership.Status).HasMaxLength(32).IsRequired();
            entity.Property(membership => membership.CreatedAtUtc).IsRequired();

            entity.HasIndex(membership => new { membership.CampaignId, membership.Email }).IsUnique();

            entity.HasOne(membership => membership.User)
                .WithMany(user => user.CampaignMemberships)
                .HasForeignKey(membership => membership.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(membership => membership.InvitedByUser)
                .WithMany()
                .HasForeignKey(membership => membership.InvitedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CharacterCampaignAssignment>(entity =>
        {
            entity.HasKey(assignment => new { assignment.CharacterId, assignment.CampaignId });
            entity.HasIndex(assignment => assignment.CampaignId);

            entity.HasOne(assignment => assignment.Character)
                .WithMany(character => character.CampaignAssignments)
                .HasForeignKey(assignment => assignment.CharacterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(assignment => assignment.Campaign)
                .WithMany(campaign => campaign.CharacterAssignments)
                .HasForeignKey(assignment => assignment.CampaignId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Character>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(120).IsRequired();
            entity.Property(c => c.PlayerName).HasMaxLength(120);
            entity.Property(c => c.ClassName).HasMaxLength(120).IsRequired();
            entity.Property(c => c.Level).IsRequired();
            entity.Property(c => c.Status).HasMaxLength(32).IsRequired();
            entity.Property(c => c.Background).HasMaxLength(500);
            entity.Property(c => c.Notes).HasColumnType("text");
            entity.Property(c => c.Backstory).HasColumnType("longtext");
            entity.Property(c => c.CreatedAtUtc).IsRequired();

            // New D&D fields
            entity.Property(c => c.Species).HasMaxLength(64);
            entity.Property(c => c.Alignment).HasMaxLength(32);
            entity.Property(c => c.Lifestyle).HasMaxLength(32);
            entity.Property(c => c.PersonalityTraits).HasColumnType("text");
            entity.Property(c => c.Ideals).HasColumnType("text");
            entity.Property(c => c.Bonds).HasColumnType("text");
            entity.Property(c => c.Flaws).HasColumnType("text");
            entity.Property(c => c.Equipment).HasColumnType("text");
            entity.Property(c => c.AbilityScores).HasMaxLength(500);
            entity.Property(c => c.Skills).HasColumnType("text");
            entity.Property(c => c.SavingThrows).HasMaxLength(500);
            entity.Property(c => c.HitPoints).IsRequired();
            entity.Property(c => c.DeathSaveFailures).IsRequired();
            entity.Property(c => c.DeathSaveSuccesses).IsRequired();
            entity.Property(c => c.ArmorClass).IsRequired();
            entity.Property(c => c.CombatStats).HasColumnType("text");
            entity.Property(c => c.Spells).HasColumnType("text");
            entity.Property(c => c.ExperiencePoints).IsRequired();
            entity.Property(c => c.PortraitUrl).HasColumnType("longtext");
            entity.Property(c => c.DetailBackgroundImageUrl).HasColumnType("longtext");
            entity.Property(c => c.Goals).HasColumnType("text");
            entity.Property(c => c.Secrets).HasColumnType("text");
            entity.Property(c => c.SessionHistory).HasColumnType("longtext");

            entity.HasIndex(c => c.CampaignId);

            entity.HasOne(c => c.OwnerUser)
                .WithMany(user => user.OwnedCharacters)
                .HasForeignKey(c => c.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
