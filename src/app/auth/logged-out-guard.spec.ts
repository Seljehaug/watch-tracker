import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { Home } from '../home/home';
import { Login } from './login';

// Lets the router run the guard, which then waits for AuthStore's check.
function letTheGuardRun(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

// On the app's real routes. The login spec opens the page for a logged-out user.
describe('loggedOutGuard', () => {
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

  // A bookmark or a typed URL: the login form is no use to someone already logged in.
  it('waits for the check, then sends a logged-in user to Home', async () => {
    const navigation = harness.navigateByUrl('/login', Home);
    await letTheGuardRun();
    expect(harness.routeDebugElement).toBeNull();

    httpTesting.expectOne('/api/auth/user').flush({ email: 'test@example.com' });
    await navigation;

    expect(TestBed.inject(Router).url).toBe('/');
    httpTesting.expectOne('/api/shows').flush([]);
  });

  // A 5xx or no answer: whoever it is gets the form, and the login says if the server is down.
  it('shows the login form when the check fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const navigation = harness.navigateByUrl('/login', Login);
    await letTheGuardRun();
    httpTesting
      .expectOne('/api/auth/user')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await navigation;
  });
});
