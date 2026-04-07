# DungeonKeep Client (Angular)

Frontend for DungeonKeep, a tabletop campaign companion for managing campaigns, characters, NPCs, rules reference, maps, and session prep.

## Tech Stack

- Angular 21 (standalone components)
- SCSS
- RxJS
- SignalR client (`@microsoft/signalr`)

## Prerequisites

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run Locally

```bash
npm start
```

App URL: `http://localhost:4200`

Note: Most features expect the backend API to be running.

## Available Scripts

- `npm start` - start Angular dev server
- `npm run build` - production build to `dist/DungeonKeep`
- `npm run watch` - development build in watch mode
- `npm test` - run unit tests (Vitest)

## Build

```bash
npm run build
```

## Backend Pairing

The frontend is designed to work with the ASP.NET Core API in `../DungeonKeep.API`.

Default backend URLs (development):

- `http://localhost:5098`
- `https://localhost:7269`

## Troubleshooting

- If SignalR-related imports fail, run `npm install` again to ensure `@microsoft/signalr` is installed.
- If API calls fail, verify backend is running and CORS is configured for `http://localhost:4200`.
