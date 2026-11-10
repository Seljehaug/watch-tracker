import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Continue watching - Watch Tracker',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'shows/add',
    title: 'Add show - Watch Tracker',
    loadComponent: () => import('./shows/show-editor/show-editor').then((m) => m.ShowEditor),
  },
  {
    path: 'shows/:showId/edit',
    title: 'Edit show - Watch Tracker',
    loadComponent: () => import('./shows/show-editor/show-editor').then((m) => m.ShowEditor),
  },
  {
    path: '**',
    title: 'Page not found - Watch Tracker',
    loadComponent: () => import('./page-not-found/page-not-found').then(m => m.PageNotFound),
  }
];
