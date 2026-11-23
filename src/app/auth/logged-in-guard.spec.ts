import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { Home } from '../home/home';
import { Login } from './login';

// Lets the router run the guard, which then waits for AuthStore's check.
function letTheGuardRun(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

// Uses the app's real routes, so the tests also catch a page left outside the guarded parent
// route. Nothing creates AuthStore before the first navigation: the guard does, as in the app.
describe('loggedInGuard', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    vi.restoreAllMocks();
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  // The parent route's guard answers before showExistsGuard runs, so an edit page never creates
  // ShowStore, and the list is never asked for without a login.
  it.each([
    ['/', '/login?returnUrl=%2F'],
    ['/shows/add', '/login?returnUrl=%2Fshows%2Fadd'],
    ['/shows/12/edit', '/login?returnUrl=%2Fshows%2F12%2Fedit'],
    ['/unknown', '/login?returnUrl=%2Funknown'],
  ])(
    'waits for the check, then sends a logged-out user from %s to %s',
    async (url, loginUrl) => {
      const navigation = harness.navigateByUrl(url, Login);
      await letTheGuardRun();
      expect(harness.routeDebugElement).toBeNull();

      httpTesting
        .expectOne('/api/auth/user')
        .flush(null, { status: 401, statusText: 'Unauthorized' });
      await navigation;

      expect(TestBed.inject(Location).path()).toBe(loginUrl);
      httpTesting.expectNone('/api/shows');
    },
  );

  // A 5xx or no answer: the user may well be logged in, and Home shows its own error.
  it('opens the page when the check fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const navigation = harness.navigateByUrl('/', Home);
    await letTheGuardRun();
    httpTesting
      .expectOne('/api/auth/user')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await navigation;

    httpTesting.expectOne('/api/shows').flush([]);
  });
});
