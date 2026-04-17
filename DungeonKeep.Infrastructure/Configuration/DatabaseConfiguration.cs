using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace DungeonKeep.Infrastructure.Configuration;

public enum DatabaseProvider
{
    Sqlite,
    MySql
}

public static class DatabaseConfiguration
{
    private const string DefaultSqliteConnectionString = "Data Source=dungeonkeep.dev.db";

    public static DatabaseProvider GetProvider(IConfiguration configuration)
    {
        var configuredProvider = configuration["Database:Provider"];

        return string.Equals(configuredProvider, "mysql", StringComparison.OrdinalIgnoreCase)
            ? DatabaseProvider.MySql
            : DatabaseProvider.Sqlite;
    }

    public static string GetSqliteConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DungeonKeepSqlite")
            ?? configuration.GetConnectionString("DungeonKeep")
            ?? DefaultSqliteConnectionString;

        return NormalizeSqliteConnectionString(connectionString);
    }

    public static string GetMySqlConnectionString(IConfiguration configuration)
    {
        return configuration.GetConnectionString("DungeonKeepMySql")
            ?? string.Empty;
    }

    public static bool ShouldAutoMigrateSqliteToMySqlOnStartup(IConfiguration configuration)
    {
        return configuration.GetValue<bool>("Database:AutoMigrateSqliteToMySqlOnStartup");
    }

    public static string? TryResolveSqliteDatabasePath(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return null;
        }

        var builder = new SqliteConnectionStringBuilder(connectionString);
        if (string.IsNullOrWhiteSpace(builder.DataSource) || builder.DataSource == ":memory:")
        {
            return null;
        }

        return ResolveSqliteDatabasePath(builder.DataSource);
    }

    public static string GetActiveConnectionString(IConfiguration configuration)
    {
        return GetProvider(configuration) switch
        {
            DatabaseProvider.MySql => RequireMySqlConnectionString(configuration),
            _ => GetSqliteConnectionString(configuration)
        };
    }

    public static void ConfigureSqlite(DbContextOptionsBuilder optionsBuilder, string connectionString)
    {
        optionsBuilder.UseSqlite(connectionString);
    }

    public static void ConfigureMySql(DbContextOptionsBuilder optionsBuilder, string connectionString)
    {
        optionsBuilder.UseMySQL(connectionString);
    }

    private static string RequireMySqlConnectionString(IConfiguration configuration)
    {
        var connectionString = GetMySqlConnectionString(configuration);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("A MySQL connection string is required when Database:Provider is set to MySql. Set ConnectionStrings__DungeonKeepMySql or switch Database:Provider to Sqlite.");
        }

        return connectionString;
    }

    private static string NormalizeSqliteConnectionString(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = DefaultSqliteConnectionString;
        }

        var builder = new SqliteConnectionStringBuilder(connectionString);
        if (string.IsNullOrWhiteSpace(builder.DataSource) || builder.DataSource == ":memory:")
        {
            return connectionString;
        }

        builder.DataSource = ResolveSqliteDatabasePath(builder.DataSource);
        return builder.ToString();
    }

    private static string ResolveSqliteDatabasePath(string dataSource)
    {
        var primaryPath = Path.IsPathRooted(dataSource)
            ? dataSource
            : Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, dataSource));

        if (CanWriteToSqlitePath(primaryPath))
        {
            return primaryPath;
        }

        var fallbackRoot = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrWhiteSpace(fallbackRoot))
        {
            fallbackRoot = Path.GetTempPath();
        }

        var fallbackPath = Path.Combine(fallbackRoot, "DungeonKeep", "App_Data", Path.GetFileName(dataSource));
        return CanWriteToSqlitePath(fallbackPath)
            ? fallbackPath
            : primaryPath;
    }

    private static bool CanWriteToSqlitePath(string filePath)
    {
        var directory = Path.GetDirectoryName(filePath);
        if (string.IsNullOrWhiteSpace(directory))
        {
            return true;
        }

        try
        {
            Directory.CreateDirectory(directory);
        }
        catch
        {
            return false;
        }

        try
        {
            if (File.Exists(filePath))
            {
                using var existingFileStream = new FileStream(filePath, FileMode.Open, FileAccess.ReadWrite, FileShare.ReadWrite);
                return true;
            }

            var probeFilePath = Path.Combine(directory, $".write-test-{Guid.NewGuid():N}.tmp");
            using (var probeFileStream = new FileStream(probeFilePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
            }

            File.Delete(probeFilePath);
            return true;
        }
        catch
        {
            return false;
        }
    }
}