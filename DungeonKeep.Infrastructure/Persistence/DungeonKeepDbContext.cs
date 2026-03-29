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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(320).IsRequired();
            entity.Property(user => user.DisplayName).HasMaxLength(120).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(2048).IsRequired();
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
            entity.Property(c => c.Summary).HasMaxLength(1000);
            entity.Property(c => c.OpenThreadsJson).HasMaxLength(8000).IsRequired();
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

        modelBuilder.Entity<Character>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(120).IsRequired();
            entity.Property(c => c.PlayerName).HasMaxLength(120);
            entity.Property(c => c.ClassName).HasMaxLength(120).IsRequired();
            entity.Property(c => c.Level).IsRequired();
            entity.Property(c => c.Status).HasMaxLength(32).IsRequired();
            entity.Property(c => c.Background).HasMaxLength(500);
            entity.Property(c => c.Notes).HasMaxLength(4000);
            entity.Property(c => c.Backstory).HasMaxLength(8000);
            entity.Property(c => c.CreatedAtUtc).IsRequired();

            // New D&D fields
            entity.Property(c => c.Species).HasMaxLength(64);
            entity.Property(c => c.Alignment).HasMaxLength(32);
            entity.Property(c => c.Lifestyle).HasMaxLength(32);
            entity.Property(c => c.PersonalityTraits).HasMaxLength(1000);
            entity.Property(c => c.Ideals).HasMaxLength(1000);
            entity.Property(c => c.Bonds).HasMaxLength(1000);
            entity.Property(c => c.Flaws).HasMaxLength(1000);
            entity.Property(c => c.Equipment).HasMaxLength(4000);
            entity.Property(c => c.AbilityScores).HasMaxLength(500);
            entity.Property(c => c.Skills).HasMaxLength(1000);
            entity.Property(c => c.SavingThrows).HasMaxLength(500);
            entity.Property(c => c.HitPoints).IsRequired();
            entity.Property(c => c.ArmorClass).IsRequired();
            entity.Property(c => c.CombatStats).HasMaxLength(2000);
            entity.Property(c => c.Spells).HasMaxLength(4000);
            entity.Property(c => c.ExperiencePoints).IsRequired();
            entity.Property(c => c.PortraitUrl).HasMaxLength(500);
            entity.Property(c => c.Goals).HasMaxLength(2000);
            entity.Property(c => c.Secrets).HasMaxLength(2000);
            entity.Property(c => c.SessionHistory).HasMaxLength(8000);

            entity.HasIndex(c => c.CampaignId);

            entity.HasOne(c => c.OwnerUser)
                .WithMany(user => user.OwnedCharacters)
                .HasForeignKey(c => c.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
