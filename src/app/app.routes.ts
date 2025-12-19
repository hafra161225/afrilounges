import { Routes } from '@angular/router';
import { loginGuard } from './guards/login-guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then( m => m.TabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./tabs/dashboard/dashboard.page').then( m => m.DashboardPage),
        canActivate: [loginGuard] // 🔒 Protected!
      },
      {
        path: 'stocks',
        loadComponent: () => import('./tabs/stocks/stocks.page').then( m => m.StocksPage),
        canActivate: [loginGuard] // 🔒 Protected!
      },
      {
        path: 'reports',
        loadComponent: () => import('./tabs/reports/reports.page').then( m => m.ReportsPage),
        canActivate: [loginGuard] // 🔒 Protected!
      },
      {
        path: 'settings',
        loadComponent: () => import('./tabs/settings/settings.page').then( m => m.SettingsPage),
        canActivate: [loginGuard] // 🔒 Protected!
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
