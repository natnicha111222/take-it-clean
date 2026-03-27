import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { DeviceService } from '../shared/services/device.service';
import { AcCardComponent } from '../shared/components/ac-card/ac-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, AcCardComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="dash-header">
        <div>
          <h1 class="dash-heading">ภาพรวมคุณภาพอากาศ</h1>
          <p class="dash-sub">อัปเดตข้อมูลแบบเรียลไทม์ · ทุก 5 วินาที</p>
        </div>
        <div class="summary-pills">
          <div class="pill pill-good">
            <span class="pill-num">{{ goodCount() }}</span>
            <span class="pill-lbl">อุปกรณ์ดี</span>
          </div>
          <div class="pill pill-moderate">
            <span class="pill-num">{{ modCount() }}</span>
            <span class="pill-lbl">พอใช้</span>
          </div>
          <div class="pill pill-bad">
            <span class="pill-num">{{ badCount() }}</span>
            <span class="pill-lbl">คุณภาพแย่</span>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="center-content">
          <mat-spinner diameter="44"></mat-spinner>
          <p class="loading-text">กำลังโหลดข้อมูลอุปกรณ์...</p>
        </div>
      }

      @if (!loading() && devices().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><ion-icon name="wifi-outline"></ion-icon></div>
          <h2>ไม่พบอุปกรณ์</h2>
          <p>ยังไม่มีอุปกรณ์เชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่อเครือข่าย</p>
          <button mat-raised-button color="primary" (click)="reload()">
            <ion-icon name="refresh-outline"></ion-icon> ลองใหม่
          </button>
        </div>
      }

      @if (!loading() && devices().length > 0) {
        <div class="card-grid">
          @for (device of devices(); track device.ip) {
            <app-ac-card [device]="device" (renamed)="reload()" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dash-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
    }
    .dash-heading {
      font-family: 'Nunito', sans-serif;
      font-size: 1.75rem; font-weight: 900;
      color: #ECF4FF; margin: 0 0 5px;
      letter-spacing: -0.025em;
    }
    .dash-sub {
      font-size: 0.82rem; color: rgba(176,200,236,0.45);
      margin: 0; letter-spacing: 0.01em;
    }
    .summary-pills { display: flex; flex-wrap: wrap; gap: 10px; }
    .pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 20px; border-radius: 14px;
      border: 1px solid transparent;
      font-family: 'Nunito', sans-serif; min-width: 72px;
    }
    .pill-num { font-size: 1.7rem; font-weight: 900; line-height: 1; letter-spacing: -0.03em; }
    .pill-lbl { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; opacity: 0.8; }
    .pill-good     { background: rgba(0,212,180,0.10); color: #00D4B4; border-color: rgba(0,212,180,0.22); }
    .pill-moderate { background: rgba(245,166,34,0.10); color: #F5A622; border-color: rgba(245,166,34,0.22); }
    .pill-bad      { background: rgba(255,68,102,0.10); color: #FF4466; border-color: rgba(255,68,102,0.22); }

    .center-content {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; min-height: 200px;
    }
    .loading-text { color: rgba(176,200,236,0.55); font-size: 0.9rem; }

    .empty-state {
      text-align: center; padding: 60px 20px;
      background: rgba(11,21,40,0.7);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      backdrop-filter: blur(20px);
    }
    .empty-icon { font-size: 4rem; margin-bottom: 16px; }
    .empty-state h2 { color: #ECF4FF; margin: 0 0 8px; font-family: 'Nunito', sans-serif; }
    .empty-state p  { color: rgba(176,200,236,0.55); margin: 0 0 24px; }
  `],
})
export class DashboardComponent implements OnInit {
  private devSvc = inject(DeviceService);
  loading = signal(true);

  devices   = computed(() => this.devSvc.devices());
  goodCount = computed(() => this.devices().filter(d => d.status === 'good').length);
  modCount  = computed(() => this.devices().filter(d => d.status === 'moderate').length);
  badCount  = computed(() => this.devices().filter(d => d.status === 'bad').length);

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading.set(true);
    this.devSvc.loadDevices().subscribe({ complete: () => this.loading.set(false) });
  }
}
