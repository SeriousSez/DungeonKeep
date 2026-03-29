using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DungeonKeep.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDnDCharacterFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", maxLength: 2048, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Setting = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    OpenThreadsJson = table.Column<string>(type: "TEXT", maxLength: 8000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuthSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Token = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuthSessions_AppUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CampaignMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CampaignId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 320, nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    InvitedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignMemberships_AppUsers_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CampaignMemberships_AppUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CampaignMemberships_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Characters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CampaignId = table.Column<Guid>(type: "TEXT", nullable: true),
                    OwnerUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    PlayerName = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    ClassName = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Level = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Background = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    Backstory = table.Column<string>(type: "TEXT", maxLength: 8000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Species = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Alignment = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Lifestyle = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    PersonalityTraits = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Ideals = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Bonds = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Flaws = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Equipment = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    AbilityScores = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Skills = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    SavingThrows = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    HitPoints = table.Column<int>(type: "INTEGER", nullable: false),
                    ArmorClass = table.Column<int>(type: "INTEGER", nullable: false),
                    CombatStats = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Spells = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    ExperiencePoints = table.Column<int>(type: "INTEGER", nullable: false),
                    PortraitUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Goals = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    Secrets = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    SessionHistory = table.Column<string>(type: "TEXT", maxLength: 8000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Characters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Characters_AppUsers_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Characters_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Email",
                table: "AppUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_Token",
                table: "AuthSessions",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_UserId",
                table: "AuthSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignMemberships_CampaignId_Email",
                table: "CampaignMemberships",
                columns: new[] { "CampaignId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignMemberships_InvitedByUserId",
                table: "CampaignMemberships",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignMemberships_UserId",
                table: "CampaignMemberships",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Characters_CampaignId",
                table: "Characters",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_Characters_OwnerUserId",
                table: "Characters",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuthSessions");

            migrationBuilder.DropTable(
                name: "CampaignMemberships");

            migrationBuilder.DropTable(
                name: "Characters");

            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropTable(
                name: "Campaigns");
        }
    }
}
