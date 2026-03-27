import {
  ChangeDetectionStrategy, Component, OnInit, OnDestroy, AfterViewInit,
  inject, input, signal, computed, DestroyRef,
  ViewChild, ElementRef, effect, NgZone, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { DeviceService } from '../shared/services/device.service';
import { WebSocketService } from '../shared/services/websocket.service';
import { DeviceDetail } from '../shared/models/device.model';
import { StatusBadgeComponent } from '../shared/components/status-badge/status-badge.component';

Chart.register(...registerables);

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe,
    MatButtonModule, MatCardModule,
    MatProgressSpinnerModule, StatusBadgeComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <button mat-button (click)="back()" class="back-btn">
        <ion-icon name="arrow-back-outline"></ion-icon> กลับ
      </button>

      @if (loading()) {
        <div class="center-content"><mat-spinner diameter="48"></mat-spinner></div>
      }

      @if (!loading() && detail()) {
        <div class="device-header">
          <div class="device-icon-lg" [class]="'icon-' + detail()!.status"><ion-icon name="snow-outline"></ion-icon></div>
          <div class="device-header-info">
            <h1 class="device-title">{{ detail()!.displayName }}</h1>
            <p class="device-ip-text">{{ detail()!.ip }}</p>
            <div class="header-badges">
              <app-status-badge [deviceStatus]="detail()!.status" />
              @if (!detail()!.online) {
                <span class="offline-badge"><ion-icon name="radio-button-off-outline"></ion-icon> ออฟไลน์</span>
              }
            </div>
          </div>
        </div>

        <div class="readings-row">
          <mat-card class="reading-card">
            <div class="rc-icon"><ion-icon name="cloudy-outline"></ion-icon></div>
            <div class="rc-value" [class]="'val-' + detail()!.status">
              {{ detail()!.reading?.pm25 | number:'1.0-1' }}
            </div>
            <div class="rc-unit">μg/m³</div>
            <div class="rc-label">ฝุ่นละออง PM2.5</div>
            <div class="rc-guide">
              <span class="guide good">≤25 ดี</span>
              <span class="guide moderate">26-50 พอใช้</span>
              <span class="guide bad">&gt;50 แย่</span>
            </div>
          </mat-card>
          <mat-card class="reading-card">
            <div class="rc-icon"><ion-icon name="thermometer-outline"></ion-icon></div>
            <div class="rc-value">{{ detail()!.reading?.temperature | number:'1.0-1' }}</div>
            <div class="rc-unit">°C</div>
            <div class="rc-label">อุณหภูมิ</div>
          </mat-card>
          <mat-card class="reading-card">
            <div class="rc-icon"><ion-icon name="water-outline"></ion-icon></div>
            <div class="rc-value">{{ detail()!.reading?.humidity | number:'1.0-0' }}</div>
            <div class="rc-unit">%</div>
            <div class="rc-label">ความชื้นสัมพัทธ์</div>
          </mat-card>
        </div>
      }

      <!-- Charts – always in DOM so ViewChild works -->
      <mat-card class="chart-card" [style.display]="detail() ? 'block' : 'none'">
        <div class="chart-tabs">
          <button class="chart-tab" [class.active]="activeTab() === 0" (click)="switchTab(0)"><ion-icon name="cloudy-outline"></ion-icon> PM2.5</button>
          <button class="chart-tab" [class.active]="activeTab() === 1" (click)="switchTab(1)"><ion-icon name="thermometer-outline"></ion-icon> อุณหภูมิ</button>
          <button class="chart-tab" [class.active]="activeTab() === 2" (click)="switchTab(2)"><ion-icon name="water-outline"></ion-icon> ความชื้น</button>
        </div>
        <div class="chart-wrap">
          <canvas #pm25Canvas [style.display]="activeTab() === 0 ? 'block' : 'none'"></canvas>
          <canvas #tempCanvas [style.display]="activeTab() === 1 ? 'block' : 'none'"></canvas>
          <canvas #humCanvas  [style.display]="activeTab() === 2 ? 'block' : 'none'"></canvas>
        </div>
      </mat-card>

      @if (!loading() && detail()) {
        <mat-card class="table-card">
          <h3 class="table-title"><ion-icon name="list-outline"></ion-icon> ข้อมูลล่าสุด</h3>
          <div class="table-scroll">
            <table class="readings-table">
              <thead>
                <tr><th>เวลา</th><th>PM2.5</th><th>อุณหภูมิ</th><th>ความชื้น</th></tr>
              </thead>
              <tbody>
                @for (r of recentReadings(); track r.timestamp) {
                  <tr>
                    <td>{{ r.timestamp | date:'HH:mm:ss' }}</td>
                    <td [class]="pm25Class(r.pm25)">{{ r.pm25 | number:'1.0-1' }}</td>
                    <td>{{ r.temperature | number:'1.0-1' }}°C</td>
                    <td>{{ r.humidity | number:'1.0-0' }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .back-btn { color: rgba(176,200,236,0.55) !important; margin-bottom: 16px; }
    .back-btn:hover { color: #ECF4FF !important; }
    .center-content { display: flex; justify-content: center; align-items: center; min-height: 300px; }

    .device-header {
      display: flex; align-items: center; gap: 20px;
      background: rgba(11,21,40,0.80); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px; padding: 22px;
      margin-bottom: 20px;
    }
    .device-icon-lg {
      font-size: 2.5rem; width: 68px; height: 68px; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .icon-good     { background: rgba(0,212,180,0.14); }
    .icon-moderate { background: rgba(245,166,34,0.14); }
    .icon-bad      { background: rgba(255,68,102,0.14); }
    .device-title   { margin: 0; font-size: 1.5rem; font-weight: 900; color: #ECF4FF; font-family: 'Nunito', sans-serif; letter-spacing: -0.02em; }
    .device-ip-text { margin: 4px 0 10px; color: rgba(176,200,236,0.38); font-size: 0.82rem; font-family: monospace; }
    .header-badges  { display: flex; gap: 8px; flex-wrap: wrap; }
    .offline-badge  {
      display: inline-flex; align-items: center;
      background: rgba(255,255,255,0.05); color: rgba(176,200,236,0.50);
      padding: 4px 12px; border-radius: 100px; font-size: 0.75rem;
      border: 1px solid rgba(255,255,255,0.10);
    }

    .readings-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
      gap: 14px; margin-bottom: 18px;
    }
    .reading-card { padding: 20px 16px !important; text-align: center; }
    .rc-icon  { font-size: 1.8rem; margin-bottom: 8px; }
    .rc-value { font-size: 2.7rem; font-weight: 900; color: #ECF4FF; line-height: 1; font-family: 'Nunito', sans-serif; letter-spacing: -0.04em; }
    .val-good     { color: #00D4B4; }
    .val-moderate { color: #F5A622; }
    .val-bad      { color: #FF4466; }
    .rc-unit  { font-size: 0.78rem; color: rgba(176,200,236,0.38); margin: 5px 0; font-family: 'Nunito', sans-serif; }
    .rc-label { font-size: 0.82rem; color: rgba(176,200,236,0.55); font-weight: 600; margin-bottom: 12px; font-family: 'Nunito', sans-serif; }
    .rc-guide { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
    .guide {
      font-size: 0.7rem; padding: 2px 8px; border-radius: 100px;
      font-family: 'Nunito', sans-serif; font-weight: 600;
      border: 1px solid transparent;
    }
    .guide.good     { background: rgba(0,212,180,0.10); color: #00D4B4; border-color: rgba(0,212,180,0.22); }
    .guide.moderate { background: rgba(245,166,34,0.10); color: #F5A622; border-color: rgba(245,166,34,0.22); }
    .guide.bad      { background: rgba(255,68,102,0.10); color: #FF4466; border-color: rgba(255,68,102,0.22); }

    .chart-card { margin-bottom: 18px; overflow: hidden; padding: 0 !important; }
    .chart-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .chart-tab {
      flex: 1; padding: 13px 8px; border: none; background: none; cursor: pointer;
      font-family: 'Noto Sans Thai', sans-serif; font-size: 0.85rem;
      color: rgba(176,200,236,0.45);
      border-bottom: 2px solid transparent; transition: all 0.18s;
    }
    .chart-tab.active { color: #00D4B4; border-bottom-color: #00D4B4; font-weight: 600; }
    .chart-tab:hover:not(.active) { color: rgba(176,200,236,0.80); background: rgba(255,255,255,0.04); }
    .chart-wrap { padding: 14px 18px 18px; height: 300px; position: relative; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }

    .table-card {}
    .table-title { margin: 0 0 14px; font-size: 0.95rem; color: rgba(176,200,236,0.80); font-family: 'Nunito', sans-serif; font-weight: 700; }
    .table-scroll { overflow-x: auto; }
    .readings-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
    .readings-table th {
      background: rgba(255,255,255,0.04); color: rgba(176,200,236,0.45);
      font-weight: 700; padding: 10px 16px; text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em;
      font-family: 'Nunito', sans-serif;
    }
    .readings-table td { padding: 8px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(176,200,236,0.75); }
    .readings-table tr:last-child td { border-bottom: none; }
    .readings-table tr:hover td { background: rgba(255,255,255,0.025); }
    .pm-good     { color: #00D4B4; font-weight: 700; font-family: 'Nunito', sans-serif; }
    .pm-moderate { color: #F5A622; font-weight: 700; font-family: 'Nunito', sans-serif; }
    .pm-bad      { color: #FF4466; font-weight: 700; font-family: 'Nunito', sans-serif; }
  `],
})
export class DeviceDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  ip = input.required<string>();

  @ViewChild('pm25Canvas') pm25Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tempCanvas') tempRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('humCanvas')  humRef!:  ElementRef<HTMLCanvasElement>;

  private devSvc = inject(DeviceService);
  private wsSvc  = inject(WebSocketService);
  private router = inject(Router);
  private zone   = inject(NgZone);
  private dr     = inject(DestroyRef);

  loading   = signal(true);
  detail    = signal<DeviceDetail | null>(null);
  activeTab = signal(0);

  private charts: Chart[] = [];
  private chartsReady = false;

  recentReadings = computed(() => [...(this.detail()?.history ?? [])].reverse().slice(0, 20));

  constructor() {
    // React to detail changes → update charts
    effect(() => {
      const d = this.detail();
      if (d && this.chartsReady) this.zone.runOutsideAngular(() => this.updateCharts(d));
    });
  }

  ngOnInit(): void {
    this.loadDetail();
    this.wsSvc.messages$.pipe(takeUntilDestroyed(this.dr)).subscribe(msg => {
      if (msg.type === 'update') {
        const live = msg.data.find(d => d.ip === this.ip());
        if (live && this.detail()) {
          this.detail.update(d => d ? {
            ...d, online: live.online, reading: live.reading, status: live.status,
            history: live.reading ? [...d.history.slice(-199), live.reading] : d.history,
          } : d);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initCharts());
    this.chartsReady = true;
    // If detail already loaded before AfterViewInit, draw immediately
    const d = this.detail();
    if (d) this.zone.runOutsideAngular(() => this.updateCharts(d));
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  private commonOptions(maxY?: number) {
    const gridColor = 'rgba(255,255,255,0.05)';
    const tickColor = 'rgba(176,200,236,0.40)';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, font: { size: 11 }, color: tickColor }, grid: { color: gridColor } },
        y: { ticks: { font: { size: 11 }, color: tickColor }, grid: { color: gridColor }, ...(maxY ? { max: maxY } : {}) },
      },
      elements: { point: { radius: 0 }, line: { tension: 0.4 } },
    };
  }

  private initCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    this.charts.push(new Chart(this.pm25Ref.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderColor: '#FF4466', backgroundColor: 'rgba(255,68,102,0.08)', fill: true, borderWidth: 2 }] },
      options: this.commonOptions(),
    }));
    this.charts.push(new Chart(this.tempRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderColor: '#F5A622', backgroundColor: 'rgba(245,166,34,0.08)', fill: true, borderWidth: 2 }] },
      options: this.commonOptions(),
    }));
    this.charts.push(new Chart(this.humRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderColor: '#00D4B4', backgroundColor: 'rgba(0,212,180,0.08)', fill: true, borderWidth: 2 }] },
      options: this.commonOptions(100),
    }));
  }

  private updateCharts(d: DeviceDetail): void {
    const labels = d.history.map(r =>
      new Date(r.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    );
    const update = (chart: Chart, data: number[]) => {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update('none');
    };
    update(this.charts[0], d.history.map(r => r.pm25));
    update(this.charts[1], d.history.map(r => r.temperature));
    update(this.charts[2], d.history.map(r => r.humidity));
  }

  loadDetail(): void {
    this.loading.set(true);
    this.devSvc.getDevice(this.ip()).subscribe({
      next: res => { if (res.success) this.detail.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  switchTab(tab: number): void {
    this.activeTab.set(tab);
    // Chart.js needs resize hint when canvas becomes visible
    setTimeout(() => this.charts[tab]?.resize(), 0);
  }

  back(): void { this.router.navigate(['/dashboard']); }

  pm25Class(pm25: number): string {
    if (pm25 < 25) return 'pm-good';
    if (pm25 <= 50) return 'pm-moderate';
    return 'pm-bad';
  }
}
