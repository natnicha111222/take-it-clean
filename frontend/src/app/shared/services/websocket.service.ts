import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceService } from './device.service';
import { WsMessage } from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private zone      = inject(NgZone);
  private devSvc    = inject(DeviceService);
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  readonly messages$ = new Subject<WsMessage>();

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url   = `${proto}://${location.host}/ws`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        this.zone.run(() => {
          this.messages$.next(msg);
          if (msg.type === 'snapshot' || msg.type === 'update') {
            // Merge live readings into devices signal
            this.devSvc.devices.update(devices =>
              devices.map(device => {
                const live = msg.data.find(d => d.ip === device.ip);
                if (!live) return device;
                return {
                  ...device,
                  online:  live.online,
                  reading: live.reading,
                  status:  live.status,
                };
              })
            );
          }
        });
      } catch { /* ignore malformed */ }
    };

    this.ws.onerror = () => console.warn('[WS] Error');

    this.ws.onclose = () => {
      console.log('[WS] Disconnected – retrying in 5s');
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    };
  }

  send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  ngOnDestroy(): void { this.disconnect(); }
}
