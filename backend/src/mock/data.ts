// ============================================================
// MOCK DATA - Replace DB calls with real DB queries here only
// Structure mirrors real IoT device API responses
// ============================================================

export interface Device {
  ip: string;
  name: string;
  online: boolean;
  lastSeen: string;
}

export interface SensorReading {
  ip: string;
  timestamp: string;
  pm25: number;      // μg/m³
  temperature: number; // °C
  humidity: number;  // %
}

export interface ServiceRequest {
  id: string;
  deviceIp: string;
  deviceName: string;
  problem: string;
  contactPhone: string;
  preferredDateTime: string;
  status: 'pending' | 'on_the_way' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// ── In-memory stores (swap with DB adapter in production) ──

export const devices: Device[] = [
  { ip: '192.168.1.101', name: 'ห้องนอนใหญ่', online: true, lastSeen: new Date().toISOString() },
  { ip: '192.168.1.102', name: 'ห้องนั่งเล่น', online: true, lastSeen: new Date().toISOString() },
  { ip: '192.168.1.103', name: '',             online: true, lastSeen: new Date().toISOString() },
  { ip: '192.168.1.104', name: 'ห้องครัว',     online: false, lastSeen: new Date(Date.now() - 3600000).toISOString() },
];

export const sensorReadings: SensorReading[] = [
  { ip: '192.168.1.101', timestamp: new Date().toISOString(), pm25: 12,  temperature: 25, humidity: 60 },
  { ip: '192.168.1.102', timestamp: new Date().toISOString(), pm25: 35,  temperature: 28, humidity: 55 },
  { ip: '192.168.1.103', timestamp: new Date().toISOString(), pm25: 68,  temperature: 30, humidity: 70 },
  { ip: '192.168.1.104', timestamp: new Date().toISOString(), pm25: 0,   temperature: 0,  humidity: 0  },
];

// Generate historical data (last 24h, every 30 min)
function generateHistory(ip: string, basePm25: number, baseTemp: number, baseHum: number): SensorReading[] {
  const history: SensorReading[] = [];
  const now = Date.now();
  for (let i = 48; i >= 0; i--) {
    history.push({
      ip,
      timestamp: new Date(now - i * 30 * 60 * 1000).toISOString(),
      pm25:        Math.max(0, basePm25  + (Math.random() - 0.5) * 10),
      temperature: Math.max(0, baseTemp  + (Math.random() - 0.5) * 2),
      humidity:    Math.min(100, Math.max(0, baseHum + (Math.random() - 0.5) * 5)),
    });
  }
  return history;
}

export const historyData: Record<string, SensorReading[]> = {
  '192.168.1.101': generateHistory('192.168.1.101', 12, 25, 60),
  '192.168.1.102': generateHistory('192.168.1.102', 35, 28, 55),
  '192.168.1.103': generateHistory('192.168.1.103', 68, 30, 70),
  '192.168.1.104': generateHistory('192.168.1.104', 10, 26, 58),
};

export const serviceRequests: ServiceRequest[] = [
  {
    id: 'SR001',
    deviceIp: '192.168.1.103',
    deviceName: '192.168.1.103',
    problem: 'PM2.5 สูงมาก แอร์มีกลิ่น',
    contactPhone: '081-234-5678',
    preferredDateTime: '2026-03-28T10:00:00',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Current live readings (mutated by WebSocket fluctuation)
export const liveReadings: Record<string, SensorReading> = Object.fromEntries(
  sensorReadings.map(r => [r.ip, { ...r }])
);

// Fluctuate live readings (called by WS interval)
export function fluctuateReadings(): void {
  for (const ip of Object.keys(liveReadings)) {
    const r = liveReadings[ip];
    const device = devices.find(d => d.ip === ip);
    if (!device?.online) continue;
    r.pm25        = Math.max(0,   r.pm25        + (Math.random() - 0.5) * 4);
    r.temperature = Math.max(15,  r.temperature + (Math.random() - 0.5) * 0.5);
    r.humidity    = Math.min(100, Math.max(10, r.humidity + (Math.random() - 0.5) * 2));
    r.timestamp   = new Date().toISOString();
    // Append to history
    if (historyData[ip]) {
      historyData[ip].push({ ...r });
      if (historyData[ip].length > 200) historyData[ip].shift();
    }
  }
}

// Helper
export function getDeviceDisplayName(device: Device): string {
  return device.name.trim() || device.ip;
}

export function getPm25Status(pm25: number, online: boolean): 'good' | 'moderate' | 'bad' {
  if (!online) return 'bad';
  if (pm25 < 25) return 'good';
  if (pm25 <= 50) return 'moderate';
  return 'bad';
}

let srCounter = serviceRequests.length + 1;
export function nextSrId(): string {
  return `SR${String(srCounter++).padStart(3, '0')}`;
}
