import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DeviceService } from './shared/services/device.service';
import { WebSocketService } from './shared/services/websocket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface NavItem { label: string; icon: string; route: string; emoji: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule,
    MatSidenavModule, MatListModule, MatBadgeModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav mode="over" [opened]="sidenavOpen()" position="start"
                   (closedStart)="sidenavOpen.set(false)"
                   class="app-sidenav">
        <div class="sidenav-logo">
          <ng-container *ngTemplateOutlet="logoTpl; context: { size: 'md' }" />
        </div>
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link"
               (click)="sidenav.close(); sidenavOpen.set(false)">
              <span class="nav-emoji">{{ item.emoji }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="app-toolbar">
          @if (isMobile()) {
            <button mat-icon-button (click)="sidenavOpen.set(true)">
              <ion-icon name="menu-outline"></ion-icon>
            </button>
          }
          <a routerLink="/dashboard" class="logo-link">
            <ng-container *ngTemplateOutlet="logoTpl; context: { size: 'sm' }" />
          </a>
          <span class="spacer"></span>
          @if (!isMobile()) {
            <nav class="desktop-nav">
              @for (item of navItems; track item.route) {
                <a mat-button [routerLink]="item.route" routerLinkActive="active-nav-btn">
                  {{ item.emoji }} {{ item.label }}
                </a>
              }
            </nav>
          }
          <div class="online-indicator">
            <span class="online-dot"></span>
            <span class="online-count">{{ onlineCount() }} อุปกรณ์</span>
          </div>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>

    <ng-template #logoTpl let-size="size">
      <div class="logo" [class]="'logo-' + size">
        <svg [attr.width]="size === 'sm' ? '36' : '48'" [attr.height]="size === 'sm' ? '36' : '48'"
             viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 34C8 34 10 26 14 24C16 23 18 23.5 19 25L20 27C21 25 22 23 24 22C26 21 28 21.5 28 24V26C29 24 30.5 22 32 22C34 21 36 23 35 26L34 30C35 29 36.5 28 38 29C40 30 40 33 38 36L34 40H16L10 38L8 34Z" fill="#00D4B4"/>
          <path d="M24 18C24 18 19 13 17 16C15.5 18 17 21 24 26C31 21 32.5 18 31 16C29 13 24 18 24 18Z" fill="white" opacity="0.9"/>
          <path d="M24 19.5C24 19.5 20 15.5 18.5 17.5C17.5 19 19 21.5 24 25.5C29 21.5 30.5 19 29.5 17.5C28 15.5 24 19.5 24 19.5Z" fill="rgba(0,212,180,0.4)"/>
          <path d="M24 20.5L24.5 22H26L24.8 22.9L25.2 24.5L24 23.5L22.8 24.5L23.2 22.9L22 22H23.5L24 20.5Z" fill="white"/>
        </svg>
        <div class="logo-text">
          <div class="logo-name">
            <span class="logo-take">take it </span><span class="logo-clean">clean</span>
          </div>
          @if (size !== 'sm') {
            <div class="logo-tagline">ระบบตรวจสอบและดูแลคุณภาพแอร์</div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .app-container { height: 100vh; }

    .app-toolbar {
      background: rgba(4,9,26,0.90) !important;
      backdrop-filter: blur(24px) !important;
      -webkit-backdrop-filter: blur(24px) !important;
      border-bottom: 1px solid rgba(255,255,255,0.08) !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.35) !important;
      color: #ECF4FF !important;
      position: sticky; top: 0; z-index: 100; height: 64px;
    }

    .logo-link { text-decoration: none; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-sm { gap: 8px; }
    .logo-name { font-family: 'Nunito', sans-serif; font-size: 1.2rem; line-height: 1.1; }
    .logo-md .logo-name { font-size: 1.4rem; }
    .logo-take  { font-weight: 400; color: rgba(176,200,236,0.75); }
    .logo-clean { font-weight: 900; color: #00D4B4; letter-spacing: -0.02em; }
    .logo-tagline { font-size: 0.7rem; color: rgba(176,200,236,0.45); font-family: 'Noto Sans Thai', sans-serif; margin-top: 2px; letter-spacing: 0.02em; }

    .spacer { flex: 1; }

    .desktop-nav { display: flex; gap: 2px; }
    .desktop-nav a {
      color: rgba(176,200,236,0.75) !important;
      font-size: 0.9rem !important;
      border-radius: 8px !important;
      transition: all 0.18s !important;
    }
    .desktop-nav a:hover { color: #ECF4FF !important; background: rgba(255,255,255,0.06) !important; }
    .active-nav-btn {
      background: rgba(0,212,180,0.12) !important;
      color: #00D4B4 !important;
      font-weight: 700 !important;
    }

    .online-indicator {
      display: flex; align-items: center; gap: 7px;
      background: rgba(0,212,180,0.08);
      border: 1px solid rgba(0,212,180,0.20);
      border-radius: 20px; padding: 6px 14px;
      font-size: 0.82rem; color: rgba(0,212,180,0.85); margin-left: 12px;
    }
    .online-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #00D4B4;
      box-shadow: 0 0 0 2px rgba(0,212,180,0.22);
      animation: pulse-dot 2.2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 0 2px rgba(0,212,180,0.22); }
      50%       { box-shadow: 0 0 0 5px rgba(0,212,180,0.07); }
    }

    .app-sidenav {
      width: 260px !important;
      background: rgba(8,15,32,0.97) !important;
      border-right: 1px solid rgba(255,255,255,0.08) !important;
      backdrop-filter: blur(20px) !important;
    }
    .sidenav-logo {
      padding: 20px 16px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .app-sidenav mat-nav-list a {
      font-family: 'Noto Sans Thai', sans-serif;
      font-size: 0.95rem;
      color: rgba(176,200,236,0.8);
      margin: 2px 8px;
      border-radius: 10px !important;
    }
    .active-link {
      background: rgba(0,212,180,0.10) !important;
      color: #00D4B4 !important;
      font-weight: 600;
      border-left: 2px solid #00D4B4;
    }
    .nav-emoji { margin-right: 8px; font-size: 1rem; }

    .main-content {
      min-height: calc(100vh - 64px);
      background: transparent;
      position: relative; z-index: 1;
    }
  `],
})
export class AppComponent implements OnInit {
  private devSvc  = inject(DeviceService);
  private wsSvc   = inject(WebSocketService);
  private bp      = inject(BreakpointObserver);

  sidenavOpen = signal(false);
  isMobile    = signal(false);
  onlineCount = computed(() => this.devSvc.devices().filter(d => d.online).length);

  navItems: NavItem[] = [
    { label: 'แดชบอร์ด',  icon: 'dashboard',    route: '/dashboard',       emoji: '🏠' },
    { label: 'ประวัติ',   icon: 'history',       route: '/history',         emoji: '📊' },
    { label: 'เรียกช่าง', icon: 'build',         route: '/service-request', emoji: '🔧' },
    { label: 'ตั้งค่า',   icon: 'settings',      route: '/settings',        emoji: '⚙️' },
  ];

  constructor() {
    this.bp.observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntilDestroyed())
      .subscribe(r => this.isMobile.set(r.matches));
  }

  ngOnInit(): void {
    this.devSvc.loadDevices().subscribe();
    this.devSvc.loadServiceRequests().subscribe();
    this.wsSvc.connect();
  }
}
