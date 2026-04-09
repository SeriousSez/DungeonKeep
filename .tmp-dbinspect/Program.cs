using MySql.Data.MySqlClient;

const string connectionString = "Server=mysql18.unoeuro.com;Port=3306;Database=sezginsahin_dk_db_tys;Uid=sezginsahin_dk;Pwd=Opel4500;";

await using var connection = new MySqlConnection(connectionString);
await connection.OpenAsync();

await using (var countCommand = connection.CreateCommand())
{
    countCommand.CommandText = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sezginsahin_dk_db_tys';";
    var tableCount = Convert.ToInt32(await countCommand.ExecuteScalarAsync());
    Console.WriteLine($"TableCount={tableCount}");
}

await using var command = connection.CreateCommand();
command.CommandText = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sezginsahin_dk_db_tys' ORDER BY table_name;";

await using var reader = await command.ExecuteReaderAsync();

var tableNames = new List<string>();

while (await reader.ReadAsync())
{
    var tableName = reader.GetString(0);
    tableNames.Add(tableName);
    Console.WriteLine(tableName);
}

await reader.CloseAsync();

foreach (var tableName in tableNames)
{
    await using var rowCountCommand = connection.CreateCommand();
    rowCountCommand.CommandText = $"SELECT COUNT(*) FROM `{tableName}`;";
    var rowCount = Convert.ToInt32(await rowCountCommand.ExecuteScalarAsync());
    Console.WriteLine($"{tableName}.RowCount={rowCount}");
}
