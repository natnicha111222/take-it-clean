import Elysia, { t } from 'elysia';
import { serviceRequests, devices, getDeviceDisplayName, nextSrId } from '../mock/data';

export const serviceRequestRoute = new Elysia({ prefix: '/api/service-request' })
  .get('/', () => ({
    success: true,
    data: serviceRequests.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  }))

  .post('/', ({ body }) => {
    const b = body as {
      deviceIp: string;
      problem: string;
      contactPhone: string;
      preferredDateTime: string;
    };
    const device = devices.find(d => d.ip === b.deviceIp);
    const now = new Date().toISOString();
    const req = {
      id: nextSrId(),
      deviceIp: b.deviceIp,
      deviceName: device ? getDeviceDisplayName(device) : b.deviceIp,
      problem: b.problem,
      contactPhone: b.contactPhone,
      preferredDateTime: b.preferredDateTime,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };
    serviceRequests.push(req);
    return { success: true, data: req };
  }, {
    body: t.Object({
      deviceIp: t.String(),
      problem: t.String(),
      contactPhone: t.String(),
      preferredDateTime: t.String(),
    }),
  })

  .put('/:id', ({ params: { id }, body }) => {
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return { success: false, error: 'Request not found' };
    const b = body as { status: 'pending' | 'on_the_way' | 'completed' };
    req.status    = b.status;
    req.updatedAt = new Date().toISOString();
    return { success: true, data: req };
  }, {
    body: t.Object({
      status: t.Union([t.Literal('pending'), t.Literal('on_the_way'), t.Literal('completed')]),
    }),
  });
