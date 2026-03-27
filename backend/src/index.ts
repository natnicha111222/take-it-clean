import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { devicesRoute }        from './routes/devices';
import { historyRoute }        from './routes/history';
import { serviceRequestRoute } from './routes/serviceRequest';
import { fluctuateReadings, liveReadings, devices, getDeviceDisplayName, getPm25Status } from './mock/data';

const app = new Elysia()
  .use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }))

  // ── REST routes ─────────────────────────────────────────
  .use(devicesRoute)
  .use(historyRoute)
  .use(serviceRequestRoute)

  // ── WebSocket – mock sensor streaming every 5s ──────────
  .ws('/ws', {
    open(ws) {
      console.log('WS client connected');
      // Send snapshot immediately
      const snapshot = devices.map(device => ({
        ip: device.ip,
        displayName: getDeviceDisplayName(device),
        online: device.online,
        reading: liveReadings[device.ip] || null,
        status: liveReadings[device.ip]
          ? getPm25Status(liveReadings[device.ip].pm25, device.online)
          : 'bad',
      }));
      ws.send(JSON.stringify({ type: 'snapshot', data: snapshot }));
    },
    message(ws, message) {
      // Support subscribe to specific IP
      try {
        const msg = JSON.parse(message as string) as { type: string; ip?: string };
        if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
      } catch { /* ignore */ }
    },
  })

  // Health check
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  .listen(3000);

console.log(`🌱 Take It Clean API running at http://localhost:${app.server?.port}`);

// Fluctuate readings every 5 seconds and broadcast to all WS clients
setInterval(() => {
  fluctuateReadings();
  const payload = devices.map(device => ({
    ip: device.ip,
    displayName: getDeviceDisplayName(device),
    online: device.online,
    reading: liveReadings[device.ip] || null,
    status: liveReadings[device.ip]
      ? getPm25Status(liveReadings[device.ip].pm25, device.online)
      : 'bad',
  }));
  // Broadcast to all connected WebSocket clients
  app.server?.publish('sensors', JSON.stringify({ type: 'update', data: payload }));
}, 5000);
