import { Location } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { routes } from '../app.routes';
import { AuthStore } from './auth-store';
import { unauthorizedInterceptor } from './unauthorized-interceptor';

// Uses the app's real routes, so the login page's guard sees the state the interceptor sets.
describe('unauthorizedInterceptor', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;
  let authStore: AuthStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        // Before provideHttpClientTesting(), which replaces the backend that sends the requests.
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    // With inject(AuthStore) above the interceptor's check for /api/auth/, this request is never
    // sent (NG0200, caught by the store as a failed check), and every test fails here.
    authStore = TestBed.inject(AuthStore);
    httpTesting.expectOne('/api/auth/user').flush({ email: 'test@example.com' });

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/shows/add');
    httpTesting.expectOne('/api/shows').flush([]);
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  const path = () => TestBed.inject(Location).path();

  // Sends a request from the open page, as next episode does, answers it, waits for any
  // navigation, and returns what the caller got.
  async function answer(status: number, statusText: string): Promise<unknown> {
    const request = firstValueFrom(
      TestBed.inject(HttpClient).post('/api/shows/12/next-episode', null),
    ).catch((error: unknown) => error);
    httpTesting.expectOne('/api/shows/12/next-episode').flush(null, { status, statusText });

    const result = await request;
    await harness.fixture.whenStable();
    return result;
  }

  it('sends a 401 to the login page, logged out, with the page as returnUrl', async () => {
    await answer(401, 'Unauthorized');

    expect(authStore.authState().status).toBe('loggedOut');
    expect(path()).toBe('/login?returnUrl=%2Fshows%2Fadd');
  });

  // So the caller's own handling still runs: next episode shows its alert, and the editor and the
  // delete dialog their message.
  it('passes the 401 on to the caller', async () => {
    expect(await answer(401, 'Unauthorized')).toMatchObject({ status: 401 });
  });

  it('leaves other errors to the caller, logged in and on the page', async () => {
    expect(await answer(500, 'Internal Server Error')).toMatchObject({ status: 500 });

    expect(authStore.authState().status).toBe('loggedIn');
    expect(path()).toBe('/shows/add');
  });

  // Such as the list fetched again when the user comes back to the login page from the password
  // manager: router.url is the login page then.
  it('leaves a 401 alone once the user is logged out', async () => {
    authStore.markAsLoggedOut();
    await harness.navigateByUrl('/login?returnUrl=%2Fshows%2Fadd');

    await answer(401, 'Unauthorized');

    expect(path()).toBe('/login?returnUrl=%2Fshows%2Fadd');
  });
});
