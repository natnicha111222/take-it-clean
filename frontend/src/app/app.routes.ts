import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'แดชบอร์ด – Take It Clean',
  },
  {
    path: 'device/:ip',
    loadComponent: () =>
      import('./device-detail/device-detail.component').then(m => m.DeviceDetailComponent),
    title: 'รายละเอียดอุปกรณ์ – Take It Clean',
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history/history.component').then(m => m.HistoryComponent),
    title: 'ประวัติ – Take It Clean',
  },
  {
    path: 'service-request',
    loadComponent: () =>
      import('./service-request/service-request.component').then(m => m.ServiceRequestComponent),
    title: 'เรียกช่าง – Take It Clean',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(m => m.SettingsComponent),
    title: 'ตั้งค่า – Take It Clean',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
