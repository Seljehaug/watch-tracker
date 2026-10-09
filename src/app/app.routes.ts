import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Continue watching - Watch Tracker',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
];
