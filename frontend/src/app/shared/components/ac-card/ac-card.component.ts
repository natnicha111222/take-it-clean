import {
  ChangeDetectionStrategy, Component, input, output,
  computed, signal, inject, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Device, ServiceRequest, ServiceStatus } from '../../models/device.model';
import { DeviceService } from '../../services/device.service';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { RenameDialogComponent, RenameDialogData } from '../rename-dialog/rename-dialog.component';
import { ServiceRequestDialogComponent, ServiceRequestDialogData } from '../service-request-dialog/service-request-dialog.component';

@Component({
  selector: 'app-ac-card',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule,
    MatTooltipModule, StatusBadgeComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="ac-card" [class]="cardClass()" (click)="navigateToDetail()">

      <!-- Status color strip along top edge -->
      <div class="top-strip" [class]="'strip-' + device().status"></div>

      <!-- Header -->
      <div class="card-header">
        <div class="device-orb" [class]="iconClass()"><ion-icon name="snow-outline"></ion-icon></div>
        <div class="device-info">
          <h3 class="device-name">{{ device().displayName }}</h3>
          <div class="device-meta">
            <span class="device-ip" *ngIf="device().name">{{ device().ip }}</span>
            @if (!device().online) {
              <span class="offline-tag">OFFLINE</span>
            }
          </div>
        </div>
        <button mat-icon-button class="rename-btn" matTooltip="ตั้งชื่ออุปกรณ์"
                (click)="openRenameDialog($event)">
          <ion-icon name="create-outline"></ion-icon>
        </button>
      </div>

      <!-- Status badge -->
      <div class="badge-row">
        <app-status-badge [deviceStatus]="device().status" />
        @if (serviceReq() && serviceReq()!.status !== 'completed') {
          <app-status-badge [serviceStatus]="serviceReq()!.status" />
        }
        @if (serviceReq()?.status === 'completed') {
          <app-status-badge [serviceStatus]="'completed'" />
        }
      </div>

      <!-- Instrument panel readings -->
      <div class="gauges">
        <div class="gauge">
          <span class="gauge-label-top">PM 2.5</span>
          <div class="gauge-display">
            <span class="gauge-num" [class]="pm25Class()">
              {{ device().reading ? (device().reading!.pm25 | number:'1.0-0') : '–' }}
            </span>
            <span class="gauge-unit">μg/m³</span>
          </div>
          <span class="gauge-icon"><ion-icon name="cloudy-outline"></ion-icon></span>
        </div>
        <div class="gauge-sep"></div>
        <div class="gauge">
          <span class="gauge-label-top">อุณหภูมิ</span>
          <div class="gauge-display">
            <span class="gauge-num">
              {{ device().reading ? (device().reading!.temperature | number:'1.0-1') : '–' }}
            </span>
            <span class="gauge-unit">°C</span>
          </div>
          <span class="gauge-icon"><ion-icon name="thermometer-outline"></ion-icon></span>
        </div>
        <div class="gauge-sep"></div>
        <div class="gauge">
          <span class="gauge-label-top">ความชื้น</span>
          <div class="gauge-display">
            <span class="gauge-num">
              {{ device().reading ? (device().reading!.humidity | number:'1.0-0') : '–' }}
            </span>
            <span class="gauge-unit">%</span>
          </div>
          <span class="gauge-icon"><ion-icon name="water-outline"></ion-icon></span>
        </div>
      </div>

      <!-- Footer -->
      <div class="card-foot">
        <div class="last-updated">
          <ion-icon name="time-outline" class="icon-xs"></ion-icon>
          {{ lastUpdated() }}
        </div>
        <div class="foot-actions" (click)="$event.stopPropagation()">
          @if (device().status === 'moderate' && !hasPendingService()) {
            <button mat-flat-button class="btn-warn" (click)="openServiceDialog()"><ion-icon name="warning-outline"></ion-icon> แจ้งเตือน</button>
          }
          @if ((device().status === 'bad' || !device().online) && !hasPendingService()) {
            <button mat-flat-button class="btn-danger" (click)="openServiceDialog()"><ion-icon name="construct-outline"></ion-icon> เรียกช่าง</button>
          }
          <button mat-stroked-button class="btn-detail" (click)="navigateToDetail()">ดูรายละเอียด</button>
        </div>
      </div>
    </mat-card>
  `,
  styles: [`
    /* ── Base card ── */
    .ac-card {
      cursor: pointer;
      transition: transform 0.22s ease, box-shadow 0.22s ease;
      overflow: hidden;
      padding: 0 !important;
      border-radius: 18px !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
    }

    /* Status-specific card styles */
    .ac-card-good {
      background: rgba(8,18,40,0.82) !important;
      border-color: rgba(0,212,180,0.22) !important;
      box-shadow: 0 4px 28px rgba(0,0,0,0.40), 0 0 18px rgba(0,212,180,0.08) !important;
    }
    .ac-card-good:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 44px rgba(0,0,0,0.50), 0 0 32px rgba(0,212,180,0.16) !important;
    }

    .ac-card-moderate {
      background: rgba(10,16,34,0.85) !important;
      border-color: rgba(245,166,34,0.22) !important;
      box-shadow: 0 4px 28px rgba(0,0,0,0.40) !important;
    }
    .ac-card-moderate:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 44px rgba(0,0,0,0.50), 0 0 32px rgba(245,166,34,0.14) !important;
    }

    .ac-card-bad {
      background: rgba(14,6,22,0.88) !important;
      border-color: rgba(255,68,102,0.28) !important;
      box-shadow: 0 4px 28px rgba(0,0,0,0.40), 0 0 20px rgba(255,68,102,0.10) !important;
      animation: card-bad-glow 3s ease-in-out infinite;
    }
    .ac-card-bad:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 44px rgba(0,0,0,0.55), 0 0 40px rgba(255,68,102,0.22) !important;
    }

    @keyframes card-bad-glow {
      0%, 100% { box-shadow: 0 4px 28px rgba(0,0,0,0.40), 0 0 20px rgba(255,68,102,0.10); }
      50%       { box-shadow: 0 4px 28px rgba(0,0,0,0.40), 0 0 32px rgba(255,68,102,0.22); }
    }

    /* ── Status strip ── */
    .top-strip {
      height: 3px;
      border-radius: 18px 18px 0 0;
    }
    .strip-good     { background: linear-gradient(90deg, #00D4B4 0%, rgba(0,212,180,0.2) 100%); }
    .strip-moderate { background: linear-gradient(90deg, #F5A622 0%, rgba(245,166,34,0.2) 100%); }
    .strip-bad      { background: linear-gradient(90deg, #FF4466 0%, rgba(255,68,102,0.2) 100%); }

    /* ── Card header ── */
    .card-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px 8px;
    }
    .device-orb {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem; flex-shrink: 0;
    }
    .device-icon-good     { background: rgba(0,212,180,0.14); }
    .device-icon-moderate { background: rgba(245,166,34,0.14); }
    .device-icon-bad      { background: rgba(255,68,102,0.14); }

    .device-info   { flex: 1; min-width: 0; }
    .device-name {
      margin: 0; font-size: 0.98rem; font-weight: 700;
      color: #ECF4FF; font-family: 'Nunito', sans-serif;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      letter-spacing: -0.01em;
    }
    .device-meta { display: flex; align-items: center; gap: 7px; margin-top: 3px; }
    .device-ip {
      font-size: 0.72rem; color: rgba(176,200,236,0.38);
      font-family: 'Courier New', monospace;
    }
    .offline-tag {
      font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em;
      color: rgba(255,68,102,0.75); background: rgba(255,68,102,0.10);
      padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,68,102,0.2);
    }
    .rename-btn { color: rgba(176,200,236,0.28) !important; width: 34px !important; height: 34px !important; flex-shrink: 0; }
    .rename-btn:hover { color: rgba(176,200,236,0.75) !important; background: rgba(255,255,255,0.06) !important; }

    /* ── Badges ── */
    .badge-row { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }

    /* ── Instrument gauges ── */
    .gauges {
      display: flex; align-items: stretch;
      border-top: 1px solid rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin: 0 16px;
      padding: 14px 0;
    }
    .gauge {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; gap: 3px; padding: 0 6px;
    }
    .gauge-sep {
      width: 1px; background: rgba(255,255,255,0.07);
      margin: 2px 0; flex-shrink: 0;
    }
    .gauge-label-top {
      font-size: 0.65rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.06em; color: rgba(176,200,236,0.40);
      font-family: 'Nunito', sans-serif;
    }
    .gauge-display { display: flex; align-items: baseline; gap: 2px; }
    .gauge-num {
      font-family: 'Nunito', sans-serif;
      font-size: 1.95rem; font-weight: 900;
      color: #ECF4FF; line-height: 1;
      letter-spacing: -0.04em;
    }
    .gauge-num-bad      { color: #FF4466; }
    .gauge-num-moderate { color: #F5A622; }
    .gauge-unit {
      font-size: 0.62rem; color: rgba(176,200,236,0.38);
      font-family: 'Nunito', sans-serif; font-weight: 600;
    }
    .gauge-icon { font-size: 1rem; }

    /* ── Footer ── */
    .card-foot {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px 14px; flex-wrap: wrap; gap: 8px;
    }
    .last-updated {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.7rem; color: rgba(176,200,236,0.30);
    }
    .last-updated ion-icon { font-size: 12px; }
    .foot-actions { display: flex; gap: 7px; flex-wrap: wrap; }

    .btn-warn {
      background: rgba(245,166,34,0.14) !important; color: #F5A622 !important;
      border-radius: 8px !important; font-size: 0.8rem !important; height: 32px !important;
    }
    .btn-danger {
      background: rgba(255,68,102,0.14) !important; color: #FF4466 !important;
      border-radius: 8px !important; font-size: 0.8rem !important; height: 32px !important;
    }
    .btn-detail {
      border: 1px solid rgba(255,255,255,0.12) !important;
      color: rgba(176,200,236,0.55) !important;
      border-radius: 8px !important; font-size: 0.8rem !important; height: 32px !important;
    }
    .btn-detail:hover {
      border-color: rgba(255,255,255,0.22) !important;
      color: #ECF4FF !important;
      background: rgba(255,255,255,0.05) !important;
    }
  `],
})
export class AcCardComponent {
  device  = input.required<Device>();
  renamed = output<void>();

  private router   = inject(Router);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private devSvc   = inject(DeviceService);

  serviceReq = computed(() => this.devSvc.getServiceRequestForDevice(this.device().ip));

  cardClass  = computed(() => `ac-card ac-card-${this.device().status}`);
  iconClass  = computed(() => `device-icon device-icon-${this.device().status}`);
  pm25Class  = computed(() => {
    const s = this.device().status;
    if (s === 'bad') return 'gauge-num gauge-num-bad';
    if (s === 'moderate') return 'gauge-num gauge-num-moderate';
    return 'gauge-num';
  });

  lastUpdated = computed(() => {
    const ts = this.device().reading?.timestamp;
    if (!ts) return 'ไม่ทราบ';
    return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  hasPendingService = computed(() => {
    const r = this.serviceReq();
    return r && r.status !== 'completed';
  });

  navigateToDetail(): void {
    this.router.navigate(['/device', this.device().ip]);
  }

  openRenameDialog(event: Event): void {
    event.stopPropagation();
    const data: RenameDialogData = { ip: this.device().ip, currentName: this.device().name };
    this.dialog.open(RenameDialogComponent, { data, width: '380px' })
      .afterClosed()
      .subscribe((name: string | null) => {
        if (name === null) return;
        this.devSvc.renameDevice(this.device().ip, name).subscribe({
          next: () => {
            this.snackBar.open('บันทึกชื่ออุปกรณ์แล้ว ✅', '', { duration: 2500 });
            this.renamed.emit();
          },
          error: () => this.snackBar.open('เกิดข้อผิดพลาด', '', { duration: 2000 }),
        });
      });
  }

  openServiceDialog(): void {
    const data: ServiceRequestDialogData = {
      deviceIp:   this.device().ip,
      deviceName: this.device().displayName,
    };
    this.dialog.open(ServiceRequestDialogComponent, { data, width: '420px' })
      .afterClosed()
      .subscribe(dto => {
        if (!dto) return;
        this.devSvc.createServiceRequest(dto).subscribe({
          next: () => this.snackBar.open('ส่งคำขอเรียกช่างแล้ว 🔧', '', { duration: 3000 }),
          error: () => this.snackBar.open('เกิดข้อผิดพลาด', '', { duration: 2000 }),
        });
      });
  }
}
