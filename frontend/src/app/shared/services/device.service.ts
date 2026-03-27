import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Device, DeviceDetail, ServiceRequest,
  CreateServiceRequestDto, ServiceStatus
} from '../models/device.model';

interface ApiResponse<T> { success: boolean; data: T; error?: string; }

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private http = inject(HttpClient);
  private readonly base = '/api';

  // Shared signal – updated by WebSocketService too
  readonly devices = signal<Device[]>([]);
  readonly serviceRequests = signal<ServiceRequest[]>([]);

  // ── Devices ─────────────────────────────────────────────
  loadDevices(): Observable<ApiResponse<Device[]>> {
    return this.http.get<ApiResponse<Device[]>>(`${this.base}/devices`).pipe(
      tap(res => { if (res.success) this.devices.set(res.data); })
    );
  }

  getDevice(ip: string): Observable<ApiResponse<DeviceDetail>> {
    return this.http.get<ApiResponse<DeviceDetail>>(`${this.base}/devices/${ip}`);
  }

  renameDevice(ip: string, name: string): Observable<ApiResponse<{ ip: string; name: string }>> {
    return this.http.put<ApiResponse<{ ip: string; name: string }>>(
      `${this.base}/devices/${ip}`,
      { name }
    ).pipe(
      tap(res => {
        if (res.success) {
          this.devices.update(list =>
            list.map(d => d.ip === ip
              ? { ...d, name, displayName: name.trim() || ip }
              : d
            )
          );
        }
      })
    );
  }

  deleteDevice(ip: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/devices/${ip}`).pipe(
      tap(res => {
        if (res.success) this.devices.update(list => list.filter(d => d.ip !== ip));
      })
    );
  }

  // ── History ──────────────────────────────────────────────
  getHistory(ip: string, limit = 48): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(
      `${this.base}/history/${ip}?limit=${limit}`
    );
  }

  // ── Service Requests ────────────────────────────────────
  loadServiceRequests(): Observable<ApiResponse<ServiceRequest[]>> {
    return this.http.get<ApiResponse<ServiceRequest[]>>(`${this.base}/service-request`).pipe(
      tap(res => { if (res.success) this.serviceRequests.set(res.data); })
    );
  }

  createServiceRequest(dto: CreateServiceRequestDto): Observable<ApiResponse<ServiceRequest>> {
    return this.http.post<ApiResponse<ServiceRequest>>(`${this.base}/service-request`, dto).pipe(
      tap(res => {
        if (res.success) this.serviceRequests.update(list => [res.data, ...list]);
      })
    );
  }

  updateServiceStatus(id: string, status: ServiceStatus): Observable<ApiResponse<ServiceRequest>> {
    return this.http.put<ApiResponse<ServiceRequest>>(
      `${this.base}/service-request/${id}`,
      { status }
    ).pipe(
      tap(res => {
        if (res.success) {
          this.serviceRequests.update(list =>
            list.map(r => r.id === id ? res.data : r)
          );
        }
      })
    );
  }

  // ── Computed helpers ─────────────────────────────────────
  getServiceRequestForDevice(ip: string): ServiceRequest | undefined {
    return this.serviceRequests()
      .filter(r => r.deviceIp === ip)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }
}
