import { Location } from '@angular/common';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AuthStore } from '../auth/auth-store';
import { Account } from './account';

// Uses the app's real routes, so the tests also catch a logout that no longer reaches the login
// page through loggedOutGuard.
describe('Account', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  // jsdom has no scrollIntoView(): a no-op the tests can spy on.
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => undefined;
  });

  afterAll(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
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

  const root = () => harness.routeNativeElement as HTMLElement;
  const path = () => TestBed.inject(Location).path();

  // The page's guard waits for AuthStore's check, so it is answered before the first navigation.
  async function open(check: 'loggedIn' | 'failed' = 'loggedIn'): Promise<void> {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    TestBed.inject(AuthStore);
    const userRequest = httpTesting.expectOne('/api/auth/user');
    if (check === 'loggedIn') {
      userRequest.flush({ email: 'test@example.com' });
    } else {
      userRequest.flush(null, { status: 500, statusText: 'Internal Server Error' });
    }

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/account', Account);
  }

  const logOutButton = () =>
    Array.from(root().querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Log out'),
    ) as HTMLButtonElement;

  const logoutError = () => root().querySelector('[role="alert"]');

  function logOut(): void {
    logOutButton().click();
    harness.detectChanges();
  }

  const logoutRequest = () => httpTesting.expectOne({ method: 'POST', url: '/api/auth/logout' });

  // One macrotask lets logOut() reach its catch, and whenStable() renders the message.
  async function failTheLogout(): Promise<void> {
    logoutRequest().flush(null, { status: 500, statusText: 'Internal Server Error' });
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }

  // One macrotask lets logOut() go on to the navigation, and whenStable() waits for it to end –
  // the login page's code is loaded first.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }

  it('logs out once the server has answered, and goes to the login page with no returnUrl', async () => {
    await open();

    logOut();

    const request = logoutRequest();
    await harness.fixture.whenStable();
    expect(path()).toBe('/account');

    request.flush(null);
    await settle();

    expect(TestBed.inject(AuthStore).authState().status).toBe('loggedOut');
    expect(path()).toBe('/login');
  });

  // The state is 'loggedOut' before the login page is shown, and that is no failed check.
  it("doesn't say the check failed in the moment before the login page", async () => {
    await open();
    logOut();

    logoutRequest().flush(null);
    harness.detectChanges();

    expect(root().textContent).not.toContain('check who is logged in');
    await settle();
  });

  // A 5xx or no answer at start-up: the guard lets it through (D132), and there is no email.
  it("says it couldn't check who is logged in when the check failed", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await open('failed');

    expect(root().textContent).toContain(
      "Couldn't check who is logged in. Reload the page to try again.",
    );
  });

  describe('when the logout fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('stays on the page and says so in view', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      await open();

      logOut();
      await failTheLogout();

      expect(path()).toBe('/account');
      expect(logoutError()?.textContent?.trim()).toBe(
        'Something went wrong while trying to log out.',
      );
      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts[0]).toBe(logoutError());
    });

    it('can be tried again, and the message goes while the next try is on its way', async () => {
      await open();
      logOut();
      await failTheLogout();
      expect(logoutError()).not.toBeNull();

      logOut();

      const retry = logoutRequest();
      expect(logoutError()).toBeNull();
      retry.flush(null);
      await settle();
      expect(path()).toBe('/login');
    });
  });
});
