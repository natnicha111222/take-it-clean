import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceStatus, ServiceStatus, STATUS_LABELS, SERVICE_STATUS_LABELS, SERVICE_STATUS_ICONS } from '../../models/device.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="badgeClass()">
      <span class="badge-icon">{{ icon() }}</span>
      <span class="badge-text">{{ label() }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 12px;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
      font-family: 'Nunito', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid transparent;
      transition: box-shadow 0.2s;
    }
    .badge-good {
      background: rgba(0,212,180,0.12);
      color: #00D4B4;
      border-color: rgba(0,212,180,0.28);
    }
    .badge-moderate {
      background: rgba(245,166,34,0.12);
      color: #F5A622;
      border-color: rgba(245,166,34,0.28);
    }
    .badge-bad {
      background: rgba(255,68,102,0.12);
      color: #FF4466;
      border-color: rgba(255,68,102,0.30);
      animation: badge-pulse-bad 2.4s ease-in-out infinite;
    }
    .badge-pending {
      background: rgba(255,107,53,0.12);
      color: #FF6B35;
      border-color: rgba(255,107,53,0.28);
    }
    .badge-on_the_way {
      background: rgba(41,182,246,0.12);
      color: #29B6F6;
      border-color: rgba(41,182,246,0.28);
    }
    .badge-completed {
      background: rgba(0,212,180,0.12);
      color: #00D4B4;
      border-color: rgba(0,212,180,0.28);
    }
    @keyframes badge-pulse-bad {
      0%, 100% { box-shadow: none; }
      50%       { box-shadow: 0 0 10px rgba(255,68,102,0.45); }
    }
    .badge-icon { font-size: 0.78rem; }
  `],
})
export class StatusBadgeComponent {
  deviceStatus  = input<DeviceStatus | null>(null);
  serviceStatus = input<ServiceStatus>('none');

  icon = computed(() => {
    if (this.serviceStatus() && this.serviceStatus() !== 'none')
      return SERVICE_STATUS_ICONS[this.serviceStatus()];
    const s = this.deviceStatus();
    if (s === 'good')     return '🟢';
    if (s === 'moderate') return '🟡';
    if (s === 'bad')      return '🔴';
    return '';
  });

  label = computed(() => {
    if (this.serviceStatus() && this.serviceStatus() !== 'none')
      return SERVICE_STATUS_LABELS[this.serviceStatus()];
    const s = this.deviceStatus();
    return s ? STATUS_LABELS[s] : '';
  });

  badgeClass = computed(() => {
    if (this.serviceStatus() && this.serviceStatus() !== 'none')
      return `badge badge-${this.serviceStatus()}`;
    return `badge badge-${this.deviceStatus() ?? 'good'}`;
  });
}
