import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService } from '../shared/services/device.service';
import {
  ServiceRequestDialogComponent,
  ServiceRequestDialogData,
} from '../shared/components/service-request-dialog/service-request-dialog.component';

@Component({
  selector: 'app-service-request',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatCardModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="section-title">🔧 คำขอเรียกช่าง</h1>
        <button mat-raised-button color="primary" (click)="openNew()">
          <ion-icon name="add-outline"></ion-icon> เรียกช่างใหม่
        </button>
      </div>

      <div class="filter-row">
        @for (f of filters; track f.value) {
          <button class="filter-chip" [class.active]="activeFilter() === f.value"
                  (click)="activeFilter.set(f.value)">
            {{ f.icon }} {{ f.label }} ({{ countByStatus(f.value) }})
          </button>
        }
      </div>

      @if (loading()) {
        <div class="center-content"><mat-spinner diameter="48"></mat-spinner></div>
      }

      @if (!loading() && filteredRequests().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h2>ไม่มีคำขอ</h2>
          <p>ยังไม่มีคำขอเรียกช่างในขณะนี้</p>
        </div>
      }

      <div class="requests-list">
        @for (req of filteredRequests(); track req.id) {
          <mat-card class="request-card" [class]="'rc-' + req.status">
            <div class="req-header">
              <div class="req-device">
                <span class="device-emoji">❄️</span>
                <div>
                  <div class="device-name">{{ req.deviceName }}</div>
                  <div class="device-ip">{{ req.deviceIp }}</div>
                </div>
              </div>
              <span class="status-badge" [class]="'sb-' + req.status">
                {{ statusIcon(req.status) }} {{ statusLabel(req.status) }}
              </span>
            </div>
            <div class="req-body">
              <div class="req-row"><ion-icon name="warning-outline" class="ri"></ion-icon><span>{{ req.problem }}</span></div>
              <div class="req-row"><ion-icon name="call-outline" class="ri"></ion-icon><span>{{ req.contactPhone }}</span></div>
              <div class="req-row"><ion-icon name="calendar-outline" class="ri"></ion-icon><span>{{ req.preferredDateTime | date:'dd/MM/yyyy HH:mm' }}</span></div>
              <div class="req-row req-id"><ion-icon name="pricetag-outline" class="ri"></ion-icon><span>{{ req.id }} · {{ req.createdAt | date:'dd/MM HH:mm' }}</span></div>
            </div>
            <div class="req-actions">
              @if (req.status === 'pending') {
                <button mat-stroked-button class="btn-blue" (click)="updateStatus(req.id, 'on_the_way')">🚗 ช่างกำลังไป</button>
              }
              @if (req.status === 'on_the_way') {
                <button mat-stroked-button class="btn-green" (click)="updateStatus(req.id, 'completed')">✅ เสร็จสิ้น</button>
              }
              @if (req.status === 'completed') {
                <span class="completed-tag">เสร็จสิ้นแล้ว ✅</span>
              }
            </div>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .filter-row  { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .filter-chip {
      padding: 6px 16px; border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.04); color: rgba(176,200,236,0.65);
      font-size: 0.85rem; cursor: pointer;
      font-family: 'Noto Sans Thai', sans-serif; transition: all 0.18s;
    }
    .filter-chip.active {
      background: rgba(0,212,180,0.12); color: #00D4B4;
      border-color: rgba(0,212,180,0.30);
    }
    .filter-chip:hover:not(.active) {
      border-color: rgba(255,255,255,0.20); color: #ECF4FF;
      background: rgba(255,255,255,0.07);
    }
    .center-content { display: flex; justify-content: center; padding: 60px; }
    .empty-state {
      text-align: center; padding: 60px 20px;
      background: rgba(11,21,40,0.7); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; backdrop-filter: blur(20px);
    }
    .empty-icon  { font-size: 4rem; margin-bottom: 16px; }
    .empty-state h2 { color: #ECF4FF; margin: 0 0 8px; font-family: 'Nunito', sans-serif; }
    .empty-state p  { color: rgba(176,200,236,0.55); }
    .requests-list { display: flex; flex-direction: column; gap: 14px; }
    .request-card {
      padding: 0 !important; overflow: hidden;
      border-radius: 16px !important;
      border-left: 3px solid transparent !important;
    }
    .rc-pending    { border-left-color: #F5A622 !important; }
    .rc-on_the_way { border-left-color: #29B6F6 !important; }
    .rc-completed  { border-left-color: rgba(0,212,180,0.5) !important; opacity: 0.75; }
    .req-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      gap: 12px; flex-wrap: wrap;
    }
    .req-device  { display: flex; align-items: center; gap: 10px; }
    .device-emoji { font-size: 1.6rem; }
    .device-name  { font-weight: 700; color: #ECF4FF; font-family: 'Nunito', sans-serif; }
    .device-ip    { font-size: 0.72rem; color: rgba(176,200,236,0.38); font-family: monospace; }
    .status-badge {
      padding: 4px 12px; border-radius: 100px;
      font-size: 0.75rem; font-weight: 700;
      font-family: 'Nunito', sans-serif; text-transform: uppercase; letter-spacing: 0.04em;
      border: 1px solid transparent;
    }
    .sb-pending    { background: rgba(255,107,53,0.12); color: #FF6B35; border-color: rgba(255,107,53,0.28); }
    .sb-on_the_way { background: rgba(41,182,246,0.12); color: #29B6F6; border-color: rgba(41,182,246,0.28); }
    .sb-completed  { background: rgba(0,212,180,0.12); color: #00D4B4; border-color: rgba(0,212,180,0.28); }
    .req-body { padding: 10px 18px; }
    .req-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 0.88rem; color: rgba(176,200,236,0.75); }
    .ri  { font-size: 16px; width: 16px; height: 16px; color: rgba(176,200,236,0.38); }
    .req-id { color: rgba(176,200,236,0.30); font-size: 0.75rem; }
    .req-actions { padding: 8px 18px 14px; display: flex; gap: 8px; }
    .btn-blue  {
      border: 1px solid rgba(41,182,246,0.35) !important; color: #29B6F6 !important;
      border-radius: 10px !important; background: rgba(41,182,246,0.08) !important;
    }
    .btn-green {
      border: 1px solid rgba(0,212,180,0.35) !important; color: #00D4B4 !important;
      border-radius: 10px !important; background: rgba(0,212,180,0.08) !important;
    }
    .completed-tag { font-size: 0.85rem; color: #00D4B4; font-weight: 700; }
  `],
})
export class ServiceRequestComponent implements OnInit {
  private devSvc   = inject(DeviceService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading      = signal(true);
  activeFilter = signal<string>('all');

  requests = computed(() => this.devSvc.serviceRequests());
  devices  = computed(() => this.devSvc.devices());

  filters = [
    { value: 'all',        label: 'ทั้งหมด',    icon: '📋' },
    { value: 'pending',    label: 'รอช่าง',      icon: '🕐' },
    { value: 'on_the_way', label: 'ช่างกำลังมา', icon: '🚗' },
    { value: 'completed',  label: 'เสร็จสิ้น',   icon: '✅' },
  ];

  filteredRequests = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.requests() : this.requests().filter(r => r.status === f);
  });

  countByStatus(status: string): number {
    return status === 'all'
      ? this.requests().length
      : this.requests().filter(r => r.status === status).length;
  }

  ngOnInit(): void {
    this.devSvc.loadServiceRequests().subscribe({
      complete: () => this.loading.set(false),
      error:    () => this.loading.set(false),
    });
    if (!this.devices().length) this.devSvc.loadDevices().subscribe();
  }

  openNew(): void {
    const firstDevice = this.devices()[0];
    const data: ServiceRequestDialogData = {
      deviceIp:   firstDevice?.ip ?? '',
      deviceName: firstDevice?.displayName ?? '',
    };
    this.dialog.open(ServiceRequestDialogComponent, { data, width: '420px' })
      .afterClosed()
      .subscribe(dto => {
        if (!dto) return;
        this.devSvc.createServiceRequest(dto).subscribe({
          next:  () => this.snackBar.open('ส่งคำขอเรียกช่างแล้ว 🔧', '', { duration: 3000 }),
          error: () => this.snackBar.open('เกิดข้อผิดพลาด', '', { duration: 2000 }),
        });
      });
  }

  updateStatus(id: string, status: 'on_the_way' | 'completed'): void {
    this.devSvc.updateServiceStatus(id, status).subscribe({
      next:  () => this.snackBar.open('อัปเดตสถานะแล้ว ✅', '', { duration: 2500 }),
      error: () => this.snackBar.open('เกิดข้อผิดพลาด', '', { duration: 2000 }),
    });
  }

  statusLabel(status: string): string {
    return ({ pending: 'รอช่าง', on_the_way: 'ช่างกำลังมา', completed: 'เสร็จสิ้น' } as Record<string,string>)[status] ?? status;
  }
  statusIcon(status: string): string {
    return ({ pending: '🕐', on_the_way: '🚗', completed: '✅' } as Record<string,string>)[status] ?? '';
  }
}
