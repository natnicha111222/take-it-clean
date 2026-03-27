import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeviceService } from '../shared/services/device.service';
import { Device } from '../shared/models/device.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1 class="section-title"><ion-icon name="settings-outline"></ion-icon> ตั้งค่าระบบ</h1>

      <mat-card class="settings-card">
        <h2 class="card-title"><ion-icon name="hardware-chip-outline"></ion-icon> จัดการอุปกรณ์</h2>
        <p class="card-subtitle">ตั้งชื่อ หรือลบอุปกรณ์ออกจากระบบ</p>

        @if (loading()) {
          <div class="center"><mat-spinner diameter="36"></mat-spinner></div>
        }

        <div class="device-list">
          @for (device of devices(); track device.ip) {
            <div class="device-row" [class.offline]="!device.online">
              <div class="device-icon-sm" [class]="'di-' + device.status">❄️</div>
              <div class="device-data">
                @if (editingIp() === device.ip) {
                  <div class="edit-row">
                    <input class="name-input" [(ngModel)]="editName"
                           placeholder="ชื่ออุปกรณ์ (ว่างไว้ = แสดง IP)"
                           (keydown.enter)="saveEdit(device)" maxlength="40">
                    <button mat-icon-button color="primary" (click)="saveEdit(device)" matTooltip="บันทึก">
                      <ion-icon name="checkmark-outline"></ion-icon>
                    </button>
                    <button mat-icon-button (click)="editingIp.set(null)" matTooltip="ยกเลิก">
                      <ion-icon name="close-outline"></ion-icon>
                    </button>
                  </div>
                } @else {
                  <div class="device-name-row">
                    <span class="device-dname">{{ device.displayName }}</span>
                    @if (!device.online) {
                      <span class="offline-chip">ออฟไลน์</span>
                    }
                  </div>
                  <span class="device-ip-sm">{{ device.ip }}</span>
                }
              </div>
              <div class="device-actions">
                @if (editingIp() !== device.ip) {
                  <button mat-icon-button (click)="startEdit(device)" matTooltip="ตั้งชื่อ">
                    <ion-icon name="create-outline"></ion-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="removeDevice(device)" matTooltip="ลบอุปกรณ์">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </mat-card>

      <mat-card class="settings-card" > 
        <h2 class="card-title">ℹ️ เกี่ยวกับแอป</h2>
        <div class="info-rows">
          <div class="info-row"><span class="info-key">ชื่อแอป</span><span class="info-val">Take It Clean</span></div>
          <div class="info-row"><span class="info-key">เวอร์ชัน</span><span class="info-val">1.0.0</span></div>
          <div class="info-row"><span class="info-key">อุปกรณ์ทั้งหมด</span><span class="info-val">{{ devices().length }} เครื่อง</span></div>
          <div class="info-row"><span class="info-key">ออนไลน์</span><span class="info-val online-val">{{ onlineCount() }} เครื่อง</span></div>
        </div>
        <h3 class="guide-title">เกณฑ์คุณภาพอากาศ PM2.5</h3>
        <div class="guide-rows">
          <div class="guide-row good"><span class="guide-dot"></span><span class="guide-range">0 – 25 μg/m³</span><span class="guide-label">คุณภาพดี – อากาศสะอาด</span></div>
          <div class="guide-row moderate"><span class="guide-dot"></span><span class="guide-range">26 – 50 μg/m³</span><span class="guide-label">พอใช้ – ควรระวัง</span></div>
          <div class="guide-row bad"><span class="guide-dot"></span><span class="guide-range">51+ μg/m³</span><span class="guide-label">คุณภาพแย่ – ควรหลีกเลี่ยง</span></div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-card { margin-bottom: 18px; }
    .card-title {
      margin: 0 0 4px; font-size: 1.1rem; color: #ECF4FF;
      font-family: 'Nunito', sans-serif; font-weight: 700;
    }
    .card-subtitle { margin: 0 0 18px; font-size: 0.85rem; color: rgba(176,200,236,0.50); }
    .center { display: flex; justify-content: center; padding: 20px; }
    .device-list { display: flex; flex-direction: column; gap: 2px; }
    .device-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 8px; border-radius: 10px; transition: background 0.18s;
    }
    .device-row:hover { background: rgba(255,255,255,0.04); }
    .device-row.offline { opacity: 0.5; }
    .device-icon-sm {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; flex-shrink: 0;
    }
    .di-good     { background: rgba(0,212,180,0.14); }
    .di-moderate { background: rgba(245,166,34,0.14); }
    .di-bad      { background: rgba(255,68,102,0.14); }
    .device-data { flex: 1; min-width: 0; }
    .device-name-row { display: flex; align-items: center; gap: 8px; }
    .device-dname  { font-weight: 600; color: #ECF4FF; font-size: 0.9rem; font-family: 'Nunito', sans-serif; }
    .offline-chip  {
      background: rgba(255,255,255,0.06); color: rgba(176,200,236,0.45);
      padding: 1px 7px; border-radius: 8px; font-size: 0.72rem;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .device-ip-sm  { font-size: 0.72rem; color: rgba(176,200,236,0.35); font-family: monospace; }
    .edit-row { display: flex; align-items: center; gap: 4px; }
    .name-input {
      flex: 1; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
      padding: 6px 12px; font-size: 0.9rem; font-family: 'Noto Sans Thai', sans-serif;
      outline: none; color: #ECF4FF;
      background: rgba(255,255,255,0.05);
      transition: border-color 0.18s;
    }
    .name-input:focus { border-color: #00D4B4; box-shadow: 0 0 0 3px rgba(0,212,180,0.12); }
    .name-input::placeholder { color: rgba(176,200,236,0.30); }
    .device-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .info-rows { margin-bottom: 20px; }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.9rem;
    }
    .info-row:last-child { border-bottom: none; }
    .info-key   { color: rgba(176,200,236,0.50); }
    .info-val   { font-weight: 700; color: #ECF4FF; font-family: 'Nunito', sans-serif; }
    .online-val { color: #00D4B4; }
    .guide-title { margin: 0 0 12px; font-size: 0.95rem; color: rgba(176,200,236,0.65); font-weight: 600; }
    .guide-rows  { display: flex; flex-direction: column; gap: 8px; }
    .guide-row   { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; border: 1px solid transparent; }
    .guide-row.good     { background: rgba(0,212,180,0.08); border-color: rgba(0,212,180,0.18); }
    .guide-row.moderate { background: rgba(245,166,34,0.08); border-color: rgba(245,166,34,0.18); }
    .guide-row.bad      { background: rgba(255,68,102,0.08); border-color: rgba(255,68,102,0.18); }
    .guide-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .guide-row.good     .guide-dot { background: #00D4B4; box-shadow: 0 0 6px rgba(0,212,180,0.5); }
    .guide-row.moderate .guide-dot { background: #F5A622; box-shadow: 0 0 6px rgba(245,166,34,0.5); }
    .guide-row.bad      .guide-dot { background: #FF4466; box-shadow: 0 0 6px rgba(255,68,102,0.5); }
    .guide-range { font-weight: 700; font-size: 0.85rem; min-width: 120px; font-family: 'Nunito', sans-serif; }
    .guide-row.good     .guide-range { color: #00D4B4; }
    .guide-row.moderate .guide-range { color: #F5A622; }
    .guide-row.bad      .guide-range { color: #FF4466; }
    .guide-label { font-size: 0.85rem; color: rgba(176,200,236,0.60); }
  `],
})
export class SettingsComponent implements OnInit {
  private devSvc   = inject(DeviceService);
  private snackBar = inject(MatSnackBar);

  loading    = signal(false);
  editingIp  = signal<string | null>(null);
  editName   = '';

  devices     = computed(() => this.devSvc.devices());
  onlineCount = computed(() => this.devices().filter(d => d.online).length);

  ngOnInit(): void {
    if (!this.devices().length) {
      this.loading.set(true);
      this.devSvc.loadDevices().subscribe({ complete: () => this.loading.set(false) });
    }
  }

  startEdit(device: Device): void {
    this.editingIp.set(device.ip);
    this.editName = device.name;
  }

  saveEdit(device: Device): void {
    this.devSvc.renameDevice(device.ip, this.editName).subscribe({
      next:  () => { this.snackBar.open('บันทึกชื่อแล้ว ✅', '', { duration: 2500 }); this.editingIp.set(null); },
      error: () => this.snackBar.open('เกิดข้อผิดพลาด', '', { duration: 2000 }),
    });
  }

  removeDevice(device: Device): void {
    if (!confirm(`ลบอุปกรณ์ "${device.displayName}" ออกจากระบบ?`)) return;
    this.devSvc.deleteDevice(device.ip).subscribe({
      next:  () => this.snackBar.open('ลบอุปกรณ์แล้ว', '', { duration: 2500 }),
      error: () => this.snackBar.open('เกิดข้อผิดพลาด', '', { duration: 2000 }),
    });
  }
}
