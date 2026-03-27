import {
  ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy,
  inject, signal, computed, ViewChild, ElementRef, effect, NgZone, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { DeviceService } from '../shared/services/device.service';
import { SensorReading } from '../shared/models/device.model';

Chart.register(...registerables);

interface HistoryResponse {
  device: { ip: string; displayName: string };
  total: number;
  readings: SensorReading[];
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe, FormsModule,
    MatCardModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1 class="section-title"><ion-icon name="bar-chart-outline"></ion-icon> ประวัติข้อมูล</h1>

      <mat-card class="selector-card">
        <mat-form-field appearance="outline" class="device-select">
          <mat-label>เลือกอุปกรณ์</mat-label>
          <mat-select [(ngModel)]="selectedIp" (ngModelChange)="loadHistory($event)">
            @for (d of devices(); track d.ip) {
              <mat-option [value]="d.ip">{{ d.displayName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-card>

      @if (loading()) {
        <div class="center-content"><mat-spinner diameter="48"></mat-spinner></div>
      }

      @if (!loading() && history()) {
        <div class="stats-row">
          <mat-card class="stat-card">
            <div class="stat-label">ค่าเฉลี่ย PM2.5</div>
            <div class="stat-value" style="color:#1B2F72">{{ avgPm25() | number:'1.0-1' }} <small>μg/m³</small></div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-label">สูงสุด PM2.5</div>
            <div class="stat-value" style="color:#C62828">{{ maxPm25() | number:'1.0-1' }} <small>μg/m³</small></div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-label">ต่ำสุด PM2.5</div>
            <div class="stat-value" style="color:#2E7D32">{{ minPm25() | number:'1.0-1' }} <small>μg/m³</small></div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-label">จำนวนบันทึก</div>
            <div class="stat-value" style="color:#1B2F72">{{ history()!.total }}</div>
          </mat-card>
        </div>
      }

      <!-- Canvas always in DOM so ViewChild works -->
      <mat-card class="chart-card" [style.display]="history() ? 'block' : 'none'">
        <h3 class="chart-title">กราฟ PM2.5 (24 ชั่วโมงล่าสุด)</h3>
        <div class="chart-wrap">
          <canvas #historyCanvas></canvas>
        </div>
      </mat-card>

      @if (!loading() && history()) {
        <mat-card class="table-card">
          <h3 class="table-title">รายการข้อมูล {{ history()!.device.displayName }}</h3>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>วันที่/เวลา</th><th>PM2.5</th><th>อุณหภูมิ</th><th>ความชื้น</th><th>สถานะ</th></tr>
              </thead>
              <tbody>
                @for (r of history()!.readings.slice().reverse(); track r.timestamp) {
                  <tr>
                    <td>{{ r.timestamp | date:'dd/MM HH:mm' }}</td>
                    <td [class]="pm25Class(r.pm25)">{{ r.pm25 | number:'1.0-1' }}</td>
                    <td>{{ r.temperature | number:'1.0-1' }}°C</td>
                    <td>{{ r.humidity | number:'1.0-0' }}%</td>
                    <td><span class="mini-badge" [class]="'mb-' + pm25Status(r.pm25)">{{ pm25StatusThai(r.pm25) }}</span></td>
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
    .selector-card { margin-bottom: 20px; padding: 16px 20px !important; }
    .device-select { width: 100%; max-width: 400px; }
    .center-content { display: flex; justify-content: center; padding: 60px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px,1fr)); gap: 14px; margin-bottom: 20px; }
    .stat-card { padding: 18px 16px !important; text-align: center; }
    .stat-label { font-size: 0.72rem; color: rgba(176,200,236,0.45); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; font-family: 'Nunito', sans-serif; font-weight: 600; }
    .stat-value { font-size: 1.9rem; font-weight: 900; font-family: 'Nunito', sans-serif; letter-spacing: -0.03em; color: #ECF4FF; }
    .stat-value small { font-size: 0.72rem; font-weight: 400; color: rgba(176,200,236,0.40); }
    .chart-card { margin-bottom: 18px; overflow: hidden; }
    .chart-title { margin: 0 0 14px; color: rgba(176,200,236,0.80); font-size: 0.95rem; font-family: 'Nunito', sans-serif; font-weight: 700; }
    .chart-wrap { height: 280px; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }
    .table-card {}
    .table-title { margin: 0 0 14px; color: rgba(176,200,236,0.80); font-size: 0.95rem; font-family: 'Nunito', sans-serif; font-weight: 700; }
    .table-scroll { overflow-x: auto; max-height: 400px; overflow-y: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
    .data-table th {
      background: rgba(255,255,255,0.04); color: rgba(176,200,236,0.55);
      font-weight: 700; padding: 10px 14px; text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      position: sticky; top: 0; z-index: 1;
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em;
      font-family: 'Nunito', sans-serif;
    }
    .data-table td { padding: 8px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); color: rgba(176,200,236,0.80); }
    .data-table tr:hover td { background: rgba(255,255,255,0.025); }
    .pm-good     { color: #00D4B4; font-weight: 700; font-family: 'Nunito', sans-serif; }
    .pm-moderate { color: #F5A622; font-weight: 700; font-family: 'Nunito', sans-serif; }
    .pm-bad      { color: #FF4466; font-weight: 700; font-family: 'Nunito', sans-serif; }
    .mini-badge {
      padding: 2px 9px; border-radius: 100px; font-size: 0.7rem; font-weight: 700;
      font-family: 'Nunito', sans-serif; text-transform: uppercase; letter-spacing: 0.04em;
      border: 1px solid transparent;
    }
    .mb-good     { background: rgba(0,212,180,0.12); color: #00D4B4; border-color: rgba(0,212,180,0.25); }
    .mb-moderate { background: rgba(245,166,34,0.12); color: #F5A622; border-color: rgba(245,166,34,0.25); }
    .mb-bad      { background: rgba(255,68,102,0.12); color: #FF4466; border-color: rgba(255,68,102,0.25); }
  `],
})
export class HistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('historyCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private devSvc = inject(DeviceService);
  private zone   = inject(NgZone);

  loading    = signal(false);
  history    = signal<HistoryResponse | null>(null);
  selectedIp = '';

  devices = computed(() => this.devSvc.devices());

  avgPm25 = computed(() => {
    const r = this.history()?.readings ?? [];
    return r.length ? r.reduce((s, x) => s + x.pm25, 0) / r.length : 0;
  });
  maxPm25 = computed(() => {
    const vals = this.history()?.readings.map(r => r.pm25) ?? [0];
    return vals.length ? Math.max(...vals) : 0;
  });
  minPm25 = computed(() => {
    const vals = this.history()?.readings.map(r => r.pm25) ?? [0];
    return vals.length ? Math.min(...vals) : 0;
  });

  private chart: Chart | null = null;
  private chartReady = false;

  constructor() {
    effect(() => {
      const h = this.history();
      if (h && this.chartReady) this.zone.runOutsideAngular(() => this.updateChart(h));
    });
  }

  ngOnInit(): void {
    if (this.devices().length) {
      this.selectedIp = this.devices()[0].ip;
      this.loadHistory(this.selectedIp);
    } else {
      this.devSvc.loadDevices().subscribe(() => {
        if (this.devices().length) {
          this.selectedIp = this.devices()[0].ip;
          this.loadHistory(this.selectedIp);
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initChart());
    this.chartReady = true;
    const h = this.history();
    if (h) this.zone.runOutsideAngular(() => this.updateChart(h));
  }

  ngOnDestroy(): void { this.chart?.destroy(); }

  private initChart(): void {
    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ data: [], borderColor: '#00D4B4', backgroundColor: 'rgba(0,212,180,0.08)', fill: true, borderWidth: 2, pointRadius: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        elements: { line: { tension: 0.4 } },
        scales: {
          x: { ticks: { maxTicksLimit: 8, color: 'rgba(176,200,236,0.45)', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: 'rgba(176,200,236,0.45)', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
      },
    });
  }

  private updateChart(h: HistoryResponse): void {
    if (!this.chart) return;
    this.chart.data.labels = h.readings.map(r =>
      new Date(r.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    );
    this.chart.data.datasets[0].data = h.readings.map(r => r.pm25);
    this.chart.update('none');
  }

  loadHistory(ip: string): void {
    if (!ip) return;
    this.loading.set(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.devSvc.getHistory(ip, 48).subscribe({
      next: (res: any) => { if (res.success) this.history.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  pm25Class(v: number): string { if (v < 25) return 'pm-good'; if (v <= 50) return 'pm-moderate'; return 'pm-bad'; }
  pm25Status(v: number): string { if (v < 25) return 'good'; if (v <= 50) return 'moderate'; return 'bad'; }
  pm25StatusThai(v: number): string { if (v < 25) return 'ดี'; if (v <= 50) return 'พอใช้'; return 'แย่'; }
}
