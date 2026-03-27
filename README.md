# Take It Clean – ระบบตรวจสอบคุณภาพแอร์

## โครงสร้างโปรเจค

```
take-it-clean/
├── backend/          ← Bun + Elysia API server
│   ├── src/
│   │   ├── mock/data.ts        ← mock data (swap with real DB here)
│   │   ├── routes/             ← REST route handlers
│   │   └── index.ts            ← server entry + WebSocket
│   └── package.json
└── frontend/         ← Angular 17 + Material + Chart.js
    └── src/app/
        ├── dashboard/          ← หน้าหลัก grid of AC cards
        ├── device-detail/      ← กราฟ + readings รายเครื่อง
        ├── history/            ← ประวัติแยกตาม device
        ├── service-request/    ← เรียกช่าง / track status
        ├── settings/           ← ตั้งชื่อ / ลบ device
        └── shared/             ← components, services, models
```

## วิธีรัน

### Backend
```bash
cd backend
bun install
bun dev
# API: http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm start
# App: http://localhost:4200
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/devices         | รายชื่ออุปกรณ์ทั้งหมด |
| GET    | /api/devices/:ip     | รายละเอียด + ประวัติ |
| PUT    | /api/devices/:ip     | ตั้งชื่ออุปกรณ์ |
| DELETE | /api/devices/:ip     | ลบอุปกรณ์ |
| GET    | /api/history/:ip     | ประวัติ sensor |
| POST   | /api/service-request | เรียกช่าง |
| GET    | /api/service-request | รายการทั้งหมด |
| PUT    | /api/service-request/:id | อัปเดตสถานะ |
| WS     | /ws                  | live sensor stream ทุก 5s |

## Color Palette

| Role | Color |
|------|-------|
| Primary   | `#1B2F72` dark navy |
| Secondary | `#C8DCEF` light blue |
| Accent    | `#5B7AB0` medium blue |
| Background| `#F5F8FC` |
| Good (PM2.5 < 25)  | `#2E7D32` green |
| Moderate (25-50)   | `#F57F17` amber |
| Bad (> 50)         | `#C62828` red |
