import sqlite3, os, uuid, datetime
p = r"c:\Repos\DungeonKeep\tmp-characters-legacy.db"
if os.path.exists(p):
    os.remove(p)
con = sqlite3.connect(p)
cur = con.cursor()
cur.execute("CREATE TABLE AppUsers (Id TEXT NOT NULL PRIMARY KEY, Email TEXT NOT NULL, DisplayName TEXT NOT NULL, PasswordHash TEXT NOT NULL, IsEmailVerified INTEGER NOT NULL DEFAULT 1, ActivationCodeHash TEXT NOT NULL DEFAULT '', ActivationCodeExpiresAtUtc TEXT NULL, CreatedAtUtc TEXT NOT NULL)")
cur.execute("CREATE UNIQUE INDEX IX_AppUsers_Email ON AppUsers (Email)")
cur.execute("CREATE TABLE AuthSessions (Id TEXT NOT NULL PRIMARY KEY, UserId TEXT NOT NULL, Token TEXT NOT NULL, CreatedAtUtc TEXT NOT NULL, ExpiresAtUtc TEXT NOT NULL)")
cur.execute("CREATE UNIQUE INDEX IX_AuthSessions_Token ON AuthSessions (Token)")
cur.execute("CREATE TABLE Characters (Id TEXT NOT NULL PRIMARY KEY, CampaignId TEXT NULL, OwnerUserId TEXT NULL, Name TEXT NOT NULL, PlayerName TEXT NOT NULL DEFAULT '', ClassName TEXT NOT NULL, Level INTEGER NOT NULL DEFAULT 1, Status TEXT NOT NULL DEFAULT 'Ready', Background TEXT NOT NULL DEFAULT '', Notes TEXT NOT NULL DEFAULT '', Backstory TEXT NOT NULL DEFAULT '', CreatedAtUtc TEXT NOT NULL, Species TEXT NOT NULL DEFAULT '', Alignment TEXT NOT NULL DEFAULT '', Lifestyle TEXT NOT NULL DEFAULT '', PersonalityTraits TEXT NOT NULL DEFAULT '', Ideals TEXT NOT NULL DEFAULT '', Bonds TEXT NOT NULL DEFAULT '', Flaws TEXT NOT NULL DEFAULT '', Equipment TEXT NOT NULL DEFAULT '', AbilityScores TEXT NOT NULL DEFAULT '', Skills TEXT NOT NULL DEFAULT '', SavingThrows TEXT NOT NULL DEFAULT '', HitPoints INTEGER NOT NULL DEFAULT 0, DeathSaveFailures INTEGER NOT NULL DEFAULT 0, DeathSaveSuccesses INTEGER NOT NULL DEFAULT 0, ArmorClass INTEGER NOT NULL DEFAULT 0, CombatStats TEXT NOT NULL DEFAULT '', Spells TEXT NOT NULL DEFAULT '', ExperiencePoints INTEGER NOT NULL DEFAULT 0, PortraitUrl TEXT NOT NULL DEFAULT '', DetailBackgroundImageUrl TEXT NULL, Goals TEXT NOT NULL DEFAULT '', Secrets TEXT NOT NULL DEFAULT '', SessionHistory TEXT NOT NULL DEFAULT '')")
uid = str(uuid.uuid4())
sid = str(uuid.uuid4())
now = datetime.datetime.utcnow().isoformat()
token = 'legacy-token'
cur.execute("INSERT INTO AppUsers (Id, Email, DisplayName, PasswordHash, CreatedAtUtc) VALUES (?, ?, ?, ?, ?)", (uid, 'a@a.com', 'Test User', 'x', now))
cur.execute("INSERT INTO AuthSessions (Id, UserId, Token, CreatedAtUtc, ExpiresAtUtc) VALUES (?, ?, ?, ?, ?)", (sid, uid, token, now, '2099-01-01T00:00:00'))
cur.execute("INSERT INTO Characters (Id, OwnerUserId, Name, ClassName, CreatedAtUtc, DetailBackgroundImageUrl) VALUES (?, ?, ?, ?, ?, NULL)", (str(uuid.uuid4()), uid, 'Legacy Hero', 'Wizard', now))
con.commit()
con.close()
print(token)
