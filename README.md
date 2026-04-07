# DungeonKeep Monorepo

DungeonKeep is a full-stack tabletop campaign companion with an Angular client and an ASP.NET Core API.

## Repository Structure

- `DUNGEONKEEP/` - Angular 21 frontend
- `DungeonKeep.API/` - ASP.NET Core API host
- `DungeonKeep.ApplicationService/` - application layer
- `DungeonKeep.Domain/` - domain entities and rules
- `DungeonKeep.Infrastructure/` - persistence and infrastructure services
- `DungeonKeep.slnx` - backend solution

## Prerequisites

- Node.js 20+
- npm 10+
- .NET SDK 10

## Quick Start (Two Terminals)

1. Run the API:

```powershell
Set-Location DungeonKeep.API
dotnet run
```

2. Run the client:

```powershell
Set-Location DUNGEONKEEP
npm install
npm start
```

### Local URLs

- Client: `http://localhost:4200`
- API (HTTP): `http://localhost:5098`
- API (HTTPS): `https://localhost:7269`

## Local Persistence

- The backend uses SQLite for development.
- Database file: `DungeonKeep.API/dungeonkeep.dev.db`
- The schema is initialized/updated on startup.

## Common Commands

Frontend:

- `npm start`
- `npm run build`
- `npm test`

Backend:

- `dotnet run --project DungeonKeep.API`
- `dotnet build DungeonKeep.slnx`

## Build Everything

```powershell
Set-Location DUNGEONKEEP
npm run build

Set-Location ..
dotnet build DungeonKeep.slnx
```

## Troubleshooting

- If frontend startup fails on SignalR imports, run `npm install` inside `DUNGEONKEEP/`.
- If client requests fail, confirm API is running and CORS allows `http://localhost:4200`.
