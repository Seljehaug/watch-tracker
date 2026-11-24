import { Routes } from '@angular/router';
import {showExistsGuard} from './shows/show-exists-guard';
import {loggedInGuard} from './auth/logged-in-guard';
import {loggedOutGuard} from './auth/logged-out-guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Log in - Watch Tracker',
    data: { hideHeaderLinks: true },
    canActivate: [loggedOutGuard],
    loadComponent: () => import('./auth/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivateChild: [loggedInGuard],
    children: [
      {
        path: '',
        title: 'Continue watching - Watch Tracker',
        loadComponent: () => import('./home/home').then((m) => m.Home),
      },
      {
        path: 'account',
        title: 'Account - Watch Tracker',
        loadComponent: () => import('./account/account').then((m) => m.Account),
      },
      {
        path: 'shows/add',
        title: 'Add show - Watch Tracker',
        loadComponent: () => import('./shows/show-editor/show-editor').then((m) => m.ShowEditor),
      },
      {
        path: 'shows/:showId/edit',
        title: 'Edit show - Watch Tracker',
        canActivate: [showExistsGuard],
        loadComponent: () => import('./shows/show-editor/show-editor').then((m) => m.ShowEditor),
      },
      {
        path: '**',
        title: 'Page not found - Watch Tracker',
        loadComponent: () => import('./page-not-found/page-not-found').then(m => m.PageNotFound),
      }
    ]
  }
];
