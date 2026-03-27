# DungeonKeep Monorepo

This repository now contains separate client and backend applications.

## Structure

- `DUNGEONKEEP/` - Angular client application
- `DungeonKeep.slnx` - Backend solution (SocialSez-style)
- `DungeonKeep.API/` - ASP.NET Core Web API host
- `DungeonKeep.ApplicationService/` - Application layer services
- `DungeonKeep.Domain/` - Domain models and business rules
- `DungeonKeep.Infrastructure/` - Infrastructure implementations

## Run the client

```powershell
Set-Location DUNGEONKEEP
npm install
npm start
```

## Run the backend

```powershell
Set-Location DungeonKeep.API
dotnet run
```

## Local persistence (SQLite)

- Backend uses SQLite for local development persistence.
- Database file is created automatically at:
  - `DungeonKeep.API/dungeonkeep.dev.db`
- No external database setup is required while developing locally.

## Backend API endpoints

- `GET /api/health`
- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/{campaignId}/characters`
- `POST /api/campaigns/{campaignId}/characters`
- `PUT /api/characters/{characterId}/backstory`

## Build both

```powershell
Set-Location DUNGEONKEEP
npm run build

Set-Location ..
dotnet build DungeonKeep.slnx
```
