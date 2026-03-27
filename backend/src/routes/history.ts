import Elysia from 'elysia';
import { historyData, devices, getDeviceDisplayName } from '../mock/data';

export const historyRoute = new Elysia({ prefix: '/api/history' })
  .get('/:ip', ({ params: { ip }, query }) => {
    const device = devices.find(d => d.ip === ip);
    if (!device) return { success: false, error: 'Device not found' };

    const limit  = Math.min(Number(query.limit)  || 48, 200);
    const offset = Number(query.offset) || 0;
    const all    = historyData[ip] || [];
    const slice  = all.slice(-(offset + limit), all.length - offset);

    return {
      success: true,
      data: {
        device: {
          ip: device.ip,
          displayName: getDeviceDisplayName(device),
        },
        total: all.length,
        readings: slice,
      },
    };
  });
