# DungeonKeep

DungeonKeep is a full-stack tabletop campaign companion for running D&D-style games. It combines an Angular frontend with an ASP.NET Core API for campaign management, character tracking, reusable NPCs, session prep, maps, rules reference, and AI-assisted drafting.

## What It Does

- Manage campaigns with members, ownership, summaries, hooks, and next-session planning.
- Track player characters, assignments, readiness, builder data, and notes.
- Maintain a reusable NPC library and campaign-specific NPC views.
- Organize session plans, open threads, loot, world notes, and maps.
- Provide a rules/reference area for quick in-app lookup.
- Support signup, login, email activation, and authenticated sessions.
- Support AI-assisted content generation for selected campaign and character workflows when OpenAI is configured.

## Tech Stack

- Frontend: Angular 21, standalone components, SCSS, RxJS, SignalR client
- Backend: ASP.NET Core on .NET 10
- Persistence: SQLite for local development, MySQL for production
- Deployment: GitHub Actions workflow with artifact build and FTP deploy to Simply.com

## Repository Layout

- `DUNGEONKEEP/` - Angular client
- `DungeonKeep.API/` - ASP.NET Core API host
- `DungeonKeep.ApplicationService/` - application services and contracts
- `DungeonKeep.Domain/` - domain entities
- `DungeonKeep.Infrastructure/` - EF Core persistence, repositories, infrastructure services
- `DungeonKeep.slnx` - backend solution
- `.github/workflows/deploy-to-simply.yml` - CI/CD workflow for API and web deploys

## Prerequisites

- Node.js 20+
- npm 10+
- .NET SDK 10

## Local Development

Run the API and frontend in separate terminals.

### 1. Start the API

```powershell
Set-Location DungeonKeep.API
dotnet run
```

Default local API URLs:

- `http://localhost:5098`
- `https://localhost:7269`

Health check:

- `GET /api/health`

### 2. Start the Angular app

```powershell
Set-Location DUNGEONKEEP
npm install
npm start
```

Default local client URL:

- `http://localhost:4200`

## Common Commands

### Frontend

```powershell
Set-Location DUNGEONKEEP
npm start
npm run build
npm test
```

### Backend

```powershell
dotnet run --project DungeonKeep.API
dotnet build DungeonKeep.slnx
```

### Build Everything

```powershell
Set-Location DUNGEONKEEP
npm run build

Set-Location ..
dotnet build DungeonKeep.slnx
```

## Authentication and Accounts

DungeonKeep uses API-backed authentication with account activation.

- Signup creates a pending account.
- Activation uses an email verification code.
- Login returns an authenticated session token.
- The frontend restores the session on refresh and redirects based on auth state.

Relevant API endpoints include:

- `POST /api/auth/signup`
- `POST /api/auth/activate`
- `POST /api/auth/resend-activation`
- `POST /api/auth/login`
- `GET /api/auth/session`

## Configuration

### Base API settings

The API uses:

- `DungeonKeep.API/appsettings.json`
- `DungeonKeep.API/appsettings.Development.json`
- optional local override: `DungeonKeep.API/appsettings.Development.Local.json`

Local overrides are the right place for developer-specific secrets and connection strings.

### Key settings

Database:

- `Database:Provider` - `Sqlite` or `MySql`
- `Database:AutoMigrateSqliteToMySqlOnStartup`
- `ConnectionStrings:DungeonKeepSqlite`
- `ConnectionStrings:DungeonKeepMySql`

OpenAI:

- `OpenAI:ApiKey` or `OPENAI_API_KEY`

Email:

- `Email:Enabled`
- `Email:Host`
- `Email:Port`
- `Email:Username`
- `Email:Password`
- `Email:FromAddress`
- `Email:ReplyToAddress`

## Local Database

Local development defaults to SQLite.

- Provider: `Sqlite`
- Default file: `DungeonKeep.API/dungeonkeep.dev.db`
- SQLite schema bootstrap runs automatically on startup in local development mode

## Production Database

Production is intended to run on MySQL.

- Set `Database:Provider` to `MySql`
- Set `ConnectionStrings:DungeonKeepMySql` to the production MySQL connection string
- Keep `ConnectionStrings:DungeonKeepSqlite` only if you still want the legacy SQLite file available for rollback/reference

### One-time SQLite to MySQL import

If you need to migrate SQLite data into an empty MySQL database, run:

```powershell
dotnet run --project DungeonKeep.API -- --migrate-sqlite-to-mysql
```

That command copies users, campaigns, characters, memberships, auth sessions, and character assignments into MySQL.

### Automatic startup import

Automatic startup import exists only for one-time cutover scenarios.

- Set `Database:AutoMigrateSqliteToMySqlOnStartup` to `true`
- Start the API in MySQL mode
- After data has been imported successfully, set it back to `false`

The current deploy workflow is configured for the post-migration steady state and keeps automatic startup import disabled.

## Real-time Updates

The API exposes a SignalR hub at:

- `/hubs/campaign`

The Angular client includes a SignalR client for campaign-related live updates.

## Deployment

Deployment is handled through `.github/workflows/deploy-to-simply.yml`.

The workflow:

- detects whether API and/or frontend files changed
- builds API and frontend artifacts separately
- generates `appsettings.Production.json` for the API from GitHub secrets
- deploys the API and Angular output over FTP
- validates that production is pinned to MySQL and that automatic SQLite startup import is disabled

Expected deployment secrets include MySQL, OpenAI, SMTP, and FTP settings.

## Frontend Notes

The frontend README in `DUNGEONKEEP/README.md` covers client-only commands in more detail.

At a high level:

- Angular uses standalone components
- page-level skeleton loaders are used while store-backed content hydrates
- the signed-out experience has its own public landing page at `/`

## Troubleshooting

### API binary is locked during build

If `dotnet build` fails with `MSB3026`, `MSB3027`, or `MSB3021`, a running `DungeonKeep.API` process is usually still holding the output files. Stop the running API process and build again.

### Frontend calls fail locally

Check that the API is running on `http://localhost:5098` and that the frontend is pointing at a reachable API base URL.

### SignalR import or runtime issues

Run `npm install` again inside `DUNGEONKEEP/` to ensure `@microsoft/signalr` is installed correctly.

### OpenAI-backed generation fails

If OpenAI configuration is missing, AI-backed generation endpoints will not work correctly. Configure `OpenAI:ApiKey` or `OPENAI_API_KEY`.

### Email activation does not send

Check SMTP configuration and ensure `Email:Enabled` resolves to `true` with a valid host and sender address.

## Status

DungeonKeep is an active application repo, not a starter template. The README should track the real architecture and deployment model, so update it whenever the auth flow, database strategy, or deploy workflow changes.
