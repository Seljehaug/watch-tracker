import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions} from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {unauthorizedInterceptor} from './auth/unauthorized-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([unauthorizedInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({scrollPositionRestoration: 'enabled'}),
      withViewTransitions()
    ),
  ],
};
