import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions} from '@angular/router';
import { routes } from './app.routes';
import {ShowStorage} from './shows/show-storage';
import {LocalStorageShowStorage} from './shows/local-storage-show-storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({scrollPositionRestoration: 'enabled'}),
      withViewTransitions()
    ),
    { provide: ShowStorage, useClass: LocalStorageShowStorage },
  ],
};
