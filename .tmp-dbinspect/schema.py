import sqlite3, json

db = r"C:\Repos\DungeonKeep\DungeonKeep.API\dungeonkeep.dev.db"
con = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
cur = con.cursor()
for table in ["Campaigns", "CampaignMemberships"]:
    print(f"TABLE {table}")
    for row in cur.execute(f"PRAGMA table_info({table})"):
        cid, name, ctype, notnull, dflt, pk = row
        print(f"{cid}\t{name}\t{ctype}\tnotnull={notnull}\tpk={pk}\tdefault={dflt}")
    print()
