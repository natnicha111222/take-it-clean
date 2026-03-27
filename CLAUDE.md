# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack IoT air quality monitoring system for AC units. Built with a Bun/Elysia backend (TypeScript) and an Angular 17 frontend.

## Development Commands

### Backend (`/backend`)
```bash
bun install          # Install dependencies
bun dev              # Run with auto-reload on http://localhost:3000
bun run src/index.ts # Run without auto-reload
```

### Frontend (`/frontend`)
```bash
npm install   # Install dependencies
npm start     # Serve with proxy to backend on http://localhost:4200
npm run build # Production build
```

Both servers must run simultaneously during development. The frontend proxies `/api` and `/ws` to `localhost:3000` via `proxy.conf.json`.

## Architecture

### Backend (`/backend/src`)
- `index.ts` — Elysia server bootstrap, WebSocket endpoint, 5-second broadcast loop
- `mock/data.ts` — In-memory store for devices, sensor readings, service requests; handles real-time fluctuation logic
- `routes/devices.ts` — Device CRUD (`GET/PUT/DELETE /api/devices/:ip`)
- `routes/history.ts` — Paginated sensor history (`GET /api/history/:ip`)
- `routes/serviceRequest.ts` — Technician request management (`GET/POST/PUT /api/service-request`)

### Frontend (`/frontend/src/app`)
- **Routing**: All routes are lazy-loaded (`app.routes.ts`)
- **State**: Angular signals in `DeviceService` hold devices and service requests; `WebSocketService` merges live readings into those signals every 5 seconds
- **Shared models**: Interfaces and constants live in `shared/models/device.model.ts`
- **Path alias**: `@shared/*` maps to `src/app/shared/*` (configured in `tsconfig.json`)

### Data Flow
1. Frontend fetches initial device list via `DeviceService` (HTTP)
2. `WebSocketService` connects to `ws://localhost:3000/ws`, receives a snapshot then updates every 5s
3. Live readings are merged into the devices signal, triggering UI updates reactively

### Key Data Models
- `Device`: `ip`, `name`, `displayName`, `online`, `lastSeen`
- `SensorReading`: `pm25`, `temperature`, `humidity`, `timestamp`
- `ServiceRequest`: `id`, `deviceIp`, `problem`, `contactPhone`, `preferredDateTime`, `status` (`pending` → `on_the_way` → `completed`)

### PM2.5 Status Thresholds
- Good: < 25
- Moderate: 25–50
- Bad: > 50
