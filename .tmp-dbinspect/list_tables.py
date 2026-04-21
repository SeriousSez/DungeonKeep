import sqlite3

db = r"C:\Repos\DungeonKeep\DungeonKeep.API\dungeonkeep.dev.db"
con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
cur = con.cursor()
print("DB", db)
print("TABLES")
for (name,) in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
    print(name)
