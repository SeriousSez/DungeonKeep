using DungeonKeep.API.Data;
using DungeonKeep.API.Hubs;
using DungeonKeep.ApplicationService.Extensions;
using DungeonKeep.Infrastructure.Configuration;
using DungeonKeep.Infrastructure.Extensions;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.Local.json",
    optional: true,
    reloadOnChange: true
);

var databaseProvider = DatabaseConfiguration.GetProvider(builder.Configuration);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
[
    "http://localhost:4200",
    "https://localhost:4200",
    "http://127.0.0.1:4200",
    "https://127.0.0.1:4200",
    "http://localhost:5173",
    "https://localhost:5173",
    "http://127.0.0.1:5173",
    "https://127.0.0.1:5173",
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000"
];

builder.Services.AddDungeonKeepInfrastructure(builder.Configuration);
builder.Services.AddDungeonKeepApplication();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApps", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (args.Contains("--migrate-sqlite-to-mysql", StringComparer.OrdinalIgnoreCase))
{
    await SqliteToMySqlMigrator.MigrateAsync(builder.Configuration, app.Logger);
    return;
}

await SqliteToMySqlMigrator.MigrateOnStartupIfNeededAsync(builder.Configuration, app.Logger);

try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<DungeonKeepDbContext>();
    dbContext.Database.EnsureCreated();

    if (databaseProvider == DatabaseProvider.Sqlite)
    {
        EnsureBaseSqliteSchema(dbContext);
        EnsureCharactersCampaignIdIsNullable(dbContext);
        EnsureCurrentSqliteSchema(dbContext);
    }

    EnsureCharacterRichTextStorage(dbContext, databaseProvider);
}
catch (Exception exception)
{
    app.Logger.LogCritical(exception, "{DatabaseProvider} schema initialization failed during startup.", databaseProvider);
    throw;
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("ClientApps");

app.MapControllers();
app.MapHub<CampaignHub>("/hubs/campaign");

app.Run();

static void EnsureBaseSqliteSchema(DungeonKeepDbContext dbContext)
{
    dbContext.Database.ExecuteSqlRaw(
        "CREATE TABLE IF NOT EXISTS AppUsers (Id TEXT NOT NULL CONSTRAINT PK_AppUsers PRIMARY KEY, Email TEXT NOT NULL, DisplayName TEXT NOT NULL, PasswordHash TEXT NOT NULL, IsEmailVerified INTEGER NOT NULL DEFAULT 0, ActivationCodeHash TEXT NOT NULL DEFAULT '', ActivationCodeExpiresAtUtc TEXT NULL, CreatedAtUtc TEXT NOT NULL);"
    );
    dbContext.Database.ExecuteSqlRaw(
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_AppUsers_Email ON AppUsers (Email);"
    );

    dbContext.Database.ExecuteSqlRaw(
        "CREATE TABLE IF NOT EXISTS AuthSessions (Id TEXT NOT NULL CONSTRAINT PK_AuthSessions PRIMARY KEY, UserId TEXT NOT NULL, Token TEXT NOT NULL, CreatedAtUtc TEXT NOT NULL, ExpiresAtUtc TEXT NOT NULL);"
    );
    dbContext.Database.ExecuteSqlRaw(
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_AuthSessions_Token ON AuthSessions (Token);"
    );

    dbContext.Database.ExecuteSqlRaw(
        "CREATE TABLE IF NOT EXISTS CampaignMemberships (Id TEXT NOT NULL CONSTRAINT PK_CampaignMemberships PRIMARY KEY, CampaignId TEXT NOT NULL, UserId TEXT NULL, Email TEXT NOT NULL, Role TEXT NOT NULL DEFAULT 'Member', Status TEXT NOT NULL DEFAULT 'Pending', InvitedByUserId TEXT NULL, CreatedAtUtc TEXT NOT NULL);"
    );
    dbContext.Database.ExecuteSqlRaw(
        "CREATE UNIQUE INDEX IF NOT EXISTS IX_CampaignMemberships_CampaignId_Email ON CampaignMemberships (CampaignId, Email);"
    );
}

static void EnsureCharactersCampaignIdIsNullable(DungeonKeepDbContext dbContext)
{
    const string emptyGuid = "00000000-0000-0000-0000-000000000000";

    using var connection = dbContext.Database.GetDbConnection();
    if (connection.State != ConnectionState.Open)
    {
        connection.Open();
    }

    using var pragmaCommand = connection.CreateCommand();
    pragmaCommand.CommandText = "SELECT \"notnull\" FROM pragma_table_info('Characters') WHERE name = 'CampaignId' LIMIT 1;";
    var campaignIdNotNull = Convert.ToInt32(pragmaCommand.ExecuteScalar() ?? 0);
    if (campaignIdNotNull == 0)
    {
        return;
    }

    dbContext.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");
    try
    {
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS Characters__new (
                Id TEXT NOT NULL CONSTRAINT PK_Characters PRIMARY KEY,
                CampaignId TEXT NULL,
                OwnerUserId TEXT NULL,
                Name TEXT NOT NULL,
                PlayerName TEXT NULL,
                ClassName TEXT NOT NULL,
                Level INTEGER NOT NULL,
                Status TEXT NOT NULL DEFAULT 'Ready',
                Background TEXT NULL,
                Notes TEXT NULL,
                Backstory TEXT NULL,
                CreatedAtUtc TEXT NOT NULL,
                CONSTRAINT FK_Characters_Campaigns_CampaignId FOREIGN KEY (CampaignId) REFERENCES Campaigns (Id) ON DELETE SET NULL,
                CONSTRAINT FK_Characters_AppUsers_OwnerUserId FOREIGN KEY (OwnerUserId) REFERENCES AppUsers (Id) ON DELETE SET NULL
            );
        ");
        dbContext.Database.ExecuteSqlRaw(@"
            INSERT INTO Characters__new (Id, CampaignId, OwnerUserId, Name, PlayerName, ClassName, Level, Status, Background, Notes, Backstory, CreatedAtUtc)
            SELECT Id,
                   CASE WHEN CampaignId = {0} THEN NULL ELSE CampaignId END,
                   OwnerUserId,
                   Name,
                   PlayerName,
                   ClassName,
                   Level,
                   COALESCE(Status, 'Ready'),
                   Background,
                   Notes,
                   COALESCE(Backstory, ''),
                   CreatedAtUtc
            FROM Characters;
        ", emptyGuid);
        dbContext.Database.ExecuteSqlRaw("DROP TABLE Characters;");
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE Characters__new RENAME TO Characters;");
        dbContext.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Characters_CampaignId ON Characters (CampaignId);");
    }
    finally
    {
        dbContext.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
    }
}

static void EnsureCharacterRichTextStorage(DungeonKeepDbContext dbContext, DatabaseProvider databaseProvider)
{
    if (databaseProvider != DatabaseProvider.MySql)
    {
        return;
    }

    EnsureMySqlLongTextColumnExists(dbContext, "Characters", "PortraitUrl");
    EnsureMySqlLongTextColumnExists(dbContext, "Characters", "DetailBackgroundImageUrl");
}

static void EnsureCurrentSqliteSchema(DungeonKeepDbContext dbContext)
{
    const string emptyGuid = "00000000-0000-0000-0000-000000000000";

    EnsureColumnExists(dbContext, "AppUsers", "IsEmailVerified", "INTEGER NOT NULL DEFAULT 0");
    EnsureColumnExists(dbContext, "AppUsers", "ActivationCodeHash", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "AppUsers", "ActivationCodeExpiresAtUtc", "TEXT NULL");

    EnsureColumnExists(dbContext, "CampaignMemberships", "UserId", "TEXT NULL");
    EnsureColumnExists(dbContext, "CampaignMemberships", "Email", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "CampaignMemberships", "Role", "TEXT NOT NULL DEFAULT 'Member'");
    EnsureColumnExists(dbContext, "CampaignMemberships", "Status", "TEXT NOT NULL DEFAULT 'Pending'");
    EnsureColumnExists(dbContext, "CampaignMemberships", "InvitedByUserId", "TEXT NULL");
    EnsureColumnExists(dbContext, "CampaignMemberships", "CreatedAtUtc", "TEXT NOT NULL DEFAULT ''");

    EnsureColumnExists(dbContext, "Campaigns", "OpenThreadsJson", "TEXT NOT NULL DEFAULT '[]'");
    EnsureColumnExists(dbContext, "Campaigns", "WorldNotesJson", "TEXT NOT NULL DEFAULT '[]'");
    EnsureColumnExists(dbContext, "Campaigns", "CampaignMapJson", "TEXT NOT NULL DEFAULT '{}'");
    EnsureColumnExists(dbContext, "Campaigns", "SessionsJson", "TEXT NOT NULL DEFAULT '[]'");
    EnsureColumnExists(dbContext, "Campaigns", "NpcsJson", "TEXT NOT NULL DEFAULT '[]'");
    EnsureColumnExists(dbContext, "Campaigns", "LootJson", "TEXT NOT NULL DEFAULT '[]'");
    EnsureColumnExists(dbContext, "Campaigns", "Tone", "TEXT NOT NULL DEFAULT 'Heroic'");
    EnsureColumnExists(dbContext, "Campaigns", "LevelStart", "INTEGER NOT NULL DEFAULT 1");
    EnsureColumnExists(dbContext, "Campaigns", "LevelEnd", "INTEGER NOT NULL DEFAULT 4");
    EnsureColumnExists(dbContext, "Campaigns", "Hook", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Campaigns", "NextSession", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Campaigns", "Summary", "TEXT NOT NULL DEFAULT ''");

    EnsureColumnExists(dbContext, "Characters", "Status", "TEXT NOT NULL DEFAULT 'Ready'");
    EnsureColumnExists(dbContext, "Characters", "OwnerUserId", "TEXT NULL");
    EnsureColumnExists(dbContext, "Characters", "Species", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Alignment", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Lifestyle", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "PersonalityTraits", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Ideals", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Bonds", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Flaws", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Equipment", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "AbilityScores", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Skills", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "SavingThrows", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "HitPoints", "INTEGER NOT NULL DEFAULT 0");
    EnsureColumnExists(dbContext, "Characters", "DeathSaveFailures", "INTEGER NOT NULL DEFAULT 0");
    EnsureColumnExists(dbContext, "Characters", "DeathSaveSuccesses", "INTEGER NOT NULL DEFAULT 0");
    EnsureColumnExists(dbContext, "Characters", "ArmorClass", "INTEGER NOT NULL DEFAULT 0");
    EnsureColumnExists(dbContext, "Characters", "CombatStats", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Spells", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "ExperiencePoints", "INTEGER NOT NULL DEFAULT 0");
    EnsureColumnExists(dbContext, "Characters", "PortraitUrl", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "DetailBackgroundImageUrl", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Goals", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "Secrets", "TEXT NOT NULL DEFAULT ''");
    EnsureColumnExists(dbContext, "Characters", "SessionHistory", "TEXT NOT NULL DEFAULT ''");

    dbContext.Database.ExecuteSqlRaw(
        "CREATE TABLE IF NOT EXISTS CharacterCampaignAssignments (CharacterId TEXT NOT NULL, CampaignId TEXT NOT NULL, CONSTRAINT PK_CharacterCampaignAssignments PRIMARY KEY (CharacterId, CampaignId), CONSTRAINT FK_CharacterCampaignAssignments_Characters_CharacterId FOREIGN KEY (CharacterId) REFERENCES Characters (Id) ON DELETE CASCADE, CONSTRAINT FK_CharacterCampaignAssignments_Campaigns_CampaignId FOREIGN KEY (CampaignId) REFERENCES Campaigns (Id) ON DELETE CASCADE);"
    );
    dbContext.Database.ExecuteSqlRaw(
        "CREATE INDEX IF NOT EXISTS IX_CharacterCampaignAssignments_CampaignId ON CharacterCampaignAssignments (CampaignId);"
    );
    dbContext.Database.ExecuteSqlRaw(
        "INSERT OR IGNORE INTO CharacterCampaignAssignments (CharacterId, CampaignId) SELECT Id, CampaignId FROM Characters WHERE CampaignId IS NOT NULL AND CampaignId <> '' AND CampaignId <> {0};",
        emptyGuid
    );

    EnsureIndexExists(dbContext, "IX_Characters_OwnerUserId", "Characters", "OwnerUserId");
}

static void EnsureColumnExists(
    DungeonKeepDbContext dbContext,
    string tableName,
    string columnName,
    string columnDefinition)
{
    using var connection = dbContext.Database.GetDbConnection();
    if (connection.State != ConnectionState.Open)
    {
        connection.Open();
    }

    using var existsCommand = connection.CreateCommand();
    existsCommand.CommandText = $"SELECT 1 FROM pragma_table_info('{tableName}') WHERE name = '{columnName}' LIMIT 1;";
    var exists = existsCommand.ExecuteScalar() is not null;
    if (exists)
    {
        return;
    }

#pragma warning disable EF1002
    dbContext.Database.ExecuteSqlRaw($"ALTER TABLE \"{tableName}\" ADD COLUMN \"{columnName}\" {columnDefinition};");
#pragma warning restore EF1002
}

static void EnsureIndexExists(DungeonKeepDbContext dbContext, string indexName, string tableName, string columnName)
{
#pragma warning disable EF1002
    dbContext.Database.ExecuteSqlRaw($"CREATE INDEX IF NOT EXISTS \"{indexName}\" ON \"{tableName}\" (\"{columnName}\");");
#pragma warning restore EF1002
}

static void EnsureMySqlLongTextColumnExists(DungeonKeepDbContext dbContext, string tableName, string columnName)
{
    using var connection = dbContext.Database.GetDbConnection();
    if (connection.State != ConnectionState.Open)
    {
        connection.Open();
    }

    using var existsCommand = connection.CreateCommand();
    existsCommand.CommandText = $"SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tableName}' AND COLUMN_NAME = '{columnName}' LIMIT 1;";
    var exists = existsCommand.ExecuteScalar() is not null;

    if (!exists)
    {
#pragma warning disable EF1002
        dbContext.Database.ExecuteSqlRaw($"ALTER TABLE `{tableName}` ADD COLUMN `{columnName}` LONGTEXT NULL;");
#pragma warning restore EF1002
        return;
    }

#pragma warning disable EF1002
    dbContext.Database.ExecuteSqlRaw($"ALTER TABLE `{tableName}` MODIFY COLUMN `{columnName}` LONGTEXT NULL;");
#pragma warning restore EF1002
}
