import Elysia, { t } from 'elysia';
import {
  devices, liveReadings, historyData,
  getDeviceDisplayName, getPm25Status
} from '../mock/data';

export const devicesRoute = new Elysia({ prefix: '/api/devices' })
  .get('/', () => {
    return {
      success: true,
      data: devices.map(device => {
        const reading = liveReadings[device.ip];
        return {
          ip: device.ip,
          name: device.name,
          displayName: getDeviceDisplayName(device),
          online: device.online,
          lastSeen: device.lastSeen,
          reading: reading || null,
          status: reading ? getPm25Status(reading.pm25, device.online) : 'bad',
        };
      }),
    };
  })

  .get('/:ip', ({ params: { ip } }) => {
    const device = devices.find(d => d.ip === ip);
    if (!device) return { success: false, error: 'Device not found' };
    const reading = liveReadings[ip];
    const history = (historyData[ip] || []).slice(-48);
    return {
      success: true,
      data: {
        ip: device.ip,
        name: device.name,
        displayName: getDeviceDisplayName(device),
        online: device.online,
        lastSeen: device.lastSeen,
        reading: reading || null,
        status: reading ? getPm25Status(reading.pm25, device.online) : 'bad',
        history,
      },
    };
  })

  .put('/:ip', ({ params: { ip }, body }) => {
    const device = devices.find(d => d.ip === ip);
    if (!device) return { success: false, error: 'Device not found' };
    device.name = (body as { name: string }).name ?? device.name;
    return { success: true, data: { ip: device.ip, name: device.name } };
  }, {
    body: t.Object({ name: t.String() }),
  })

  .delete('/:ip', ({ params: { ip } }) => {
    const idx = devices.findIndex(d => d.ip === ip);
    if (idx === -1) return { success: false, error: 'Device not found' };
    devices.splice(idx, 1);
    delete liveReadings[ip];
    delete historyData[ip];
    return { success: true, message: 'Device removed' };
  });
