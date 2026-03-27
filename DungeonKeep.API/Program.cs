using DungeonKeep.ApplicationService.Extensions;
using DungeonKeep.Infrastructure.Extensions;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.Local.json",
    optional: true,
    reloadOnChange: true
);

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApps", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DungeonKeepDbContext>();
    dbContext.Database.EnsureCreated();

    try
    {
        dbContext.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS AppUsers (Id TEXT NOT NULL CONSTRAINT PK_AppUsers PRIMARY KEY, Email TEXT NOT NULL, DisplayName TEXT NOT NULL, PasswordHash TEXT NOT NULL, CreatedAtUtc TEXT NOT NULL);");
        dbContext.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_AppUsers_Email ON AppUsers (Email);");
    }
    catch
    {
    }

    try
    {
        dbContext.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS AuthSessions (Id TEXT NOT NULL CONSTRAINT PK_AuthSessions PRIMARY KEY, UserId TEXT NOT NULL, Token TEXT NOT NULL, CreatedAtUtc TEXT NOT NULL, ExpiresAtUtc TEXT NOT NULL);");
        dbContext.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_AuthSessions_Token ON AuthSessions (Token);");
    }
    catch
    {
    }

    try
    {
        dbContext.Database.ExecuteSqlRaw("CREATE TABLE IF NOT EXISTS CampaignMemberships (Id TEXT NOT NULL CONSTRAINT PK_CampaignMemberships PRIMARY KEY, CampaignId TEXT NOT NULL, UserId TEXT NULL, Email TEXT NOT NULL, Role TEXT NOT NULL DEFAULT 'Member', Status TEXT NOT NULL DEFAULT 'Pending', InvitedByUserId TEXT NULL, CreatedAtUtc TEXT NOT NULL);");
        dbContext.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_CampaignMemberships_CampaignId_Email ON CampaignMemberships (CampaignId, Email);");
    }
    catch
    {
    }

    try
    {
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE Campaigns ADD COLUMN OpenThreadsJson TEXT NOT NULL DEFAULT '[]';");
    }
    catch
    {
    }

    try
    {
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE Characters ADD COLUMN Status TEXT NOT NULL DEFAULT 'Ready';");
    }
    catch
    {
    }

    try
    {
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE Characters ADD COLUMN OwnerUserId TEXT NULL;");
    }
    catch
    {
    }
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

app.Run();
