export type DeviceStatus = 'good' | 'moderate' | 'bad';
export type ServiceStatus = 'none' | 'pending' | 'on_the_way' | 'completed';

export interface SensorReading {
  ip: string;
  timestamp: string;
  pm25: number;
  temperature: number;
  humidity: number;
}

export interface Device {
  ip: string;
  name: string;
  displayName: string;
  online: boolean;
  lastSeen: string;
  reading: SensorReading | null;
  status: DeviceStatus;
}

export interface DeviceDetail extends Device {
  history: SensorReading[];
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

export interface CreateServiceRequestDto {
  deviceIp: string;
  problem: string;
  contactPhone: string;
  preferredDateTime: string;
}

export interface WsMessage {
  type: 'snapshot' | 'update' | 'pong';
  data: WsDevicePayload[];
}

export interface WsDevicePayload {
  ip: string;
  displayName: string;
  online: boolean;
  reading: SensorReading | null;
  status: DeviceStatus;
}

// Display helpers
export const STATUS_LABELS: Record<string, string> = {
  good: 'ดี',
  moderate: 'พอใช้',
  bad: 'แย่',
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  none: '',
  pending: 'รอช่าง',
  on_the_way: 'ช่างกำลังมา',
  completed: 'เสร็จสิ้น',
};

export const SERVICE_STATUS_ICONS: Record<string, string> = {
  none: '',
  pending: '🕐',
  on_the_way: '🚗',
  completed: '✅',
};

export const PM25_THRESHOLDS = {
  good: 25,
  moderate: 50,
};
