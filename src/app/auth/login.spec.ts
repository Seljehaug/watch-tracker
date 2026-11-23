import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import type { LoginPostModel } from './login-post-model';
import { Login } from './login';

const login: LoginPostModel = { email: 'test@example.com', password: 'a-long-test-password' };

// Uses the app's real routes, so the tests also catch a `returnUrl` that no longer reaches the
// input through the router's query parameters.
describe('Login', () => {
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

  async function open(url = '/login'): Promise<void> {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Login);
    harness.detectChanges();

    // The page creates AuthStore, which asks who is logged in.
    httpTesting
      .expectOne('/api/auth/user')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
  }

  // Finds a control through its label, as a user does.
  function field(label: string): HTMLInputElement {
    const labelElement = Array.from(root().querySelectorAll('label')).find((element) =>
      element.textContent?.trim().startsWith(label),
    );
    return root().querySelector(`[id="${labelElement?.htmlFor}"]`) as HTMLInputElement;
  }

  function type(label: string, text: string): void {
    const input = field(label);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  function fillIn(): void {
    type('Email', login.email);
    type('Password', login.password);
  }

  const loginButton = () => root().querySelector('button[type="submit"]') as HTMLButtonElement;

  const loginError = () => root().querySelector('[role="alert"]');

  function logIn(): void {
    loginButton().click();
    harness.detectChanges();
  }

  const loginRequest = () => httpTesting.expectOne({ method: 'POST', url: '/api/auth/login' });

  // One macrotask lets the form finish its submit, so submitting() is false again before rendering.
  async function failTheLogin(status: number, statusText: string): Promise<void> {
    loginRequest().flush(null, { status, statusText });
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();
  }

  // One macrotask lets the form's submit go on to the navigation, and whenStable() waits for it to
  // end – the first time a page opens, its code is loaded first.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }

  // Home and the editor create ShowStore, which fetches the list.
  function answerShows(): void {
    httpTesting.expectOne({ method: 'GET', url: '/api/shows' }).flush([]);
  }

  it('sends the email and password, and goes to Home once the server has said yes', async () => {
    await open();
    fillIn();

    logIn();

    const request = loginRequest();
    expect(request.request.body).toEqual(login);
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/login');

    request.flush({ email: login.email });
    await settle();

    expect(TestBed.inject(Router).url).toBe('/');
    answerShows();
  });

  it('goes to the returnUrl after logging in', async () => {
    await open('/login?returnUrl=%2Fshows%2Fadd');
    fillIn();

    logIn();
    loginRequest().flush({ email: login.email });
    await settle();

    expect(TestBed.inject(Router).url).toBe('/shows/add');
    answerShows();
  });

  describe('when the login fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    // The server answers 401 to every failed login and never says which field was wrong (D93).
    it('stays on the page with the values kept, and says the email or password is wrong', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      await open();
      fillIn();

      logIn();
      await failTheLogin(401, 'Unauthorized');

      expect(TestBed.inject(Router).url).toBe('/login');
      expect(field('Email').value).toBe(login.email);
      expect(field('Password').value).toBe(login.password);
      expect(loginError()?.textContent?.trim()).toBe('Wrong email or password.');
      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts[0]).toBe(loginError());
    });

    it('says something else when the server fails', async () => {
      await open();
      fillIn();

      logIn();
      await failTheLogin(500, 'Internal Server Error');

      expect(TestBed.inject(Router).url).toBe('/login');
      expect(loginError()?.textContent?.trim()).toBe('Something went wrong when trying to log in.');
    });

    it('drops the message while the next try is on its way', async () => {
      await open();
      fillIn();
      logIn();
      await failTheLogin(401, 'Unauthorized');
      expect(loginError()).not.toBeNull();

      logIn();

      const retry = loginRequest();
      expect(loginError()).toBeNull();
      retry.flush({ email: login.email });
      await settle();
      answerShows();
    });

    it('drops the message when the next try stops at an invalid field', async () => {
      await open();
      fillIn();
      logIn();
      await failTheLogin(401, 'Unauthorized');
      expect(loginError()).not.toBeNull();

      type('Password', '');
      logIn();
      await harness.fixture.whenStable();

      expect(loginError()).toBeNull();
    });
  });

  describe('when the form is invalid', () => {
    it('sends nothing and focuses Email when both fields are empty', async () => {
      await open();

      logIn();
      await harness.fixture.whenStable();

      httpTesting.expectNone({ method: 'POST', url: '/api/auth/login' });
      expect(field('Email').getAttribute('aria-invalid')).toBe('true');
      expect(field('Password').getAttribute('aria-invalid')).toBe('true');
      expect(document.activeElement).toBe(field('Email'));
    });

    it('sends nothing when the email is not an email address', async () => {
      await open();
      type('Email', 'test.example.com');
      type('Password', login.password);

      logIn();
      await harness.fixture.whenStable();

      httpTesting.expectNone({ method: 'POST', url: '/api/auth/login' });
      const email = field('Email');
      const description = root().querySelector(`[id="${email.getAttribute('aria-describedby')}"]`);
      expect(description?.textContent?.trim()).toBe('Email must be a valid email address.');
      expect(document.activeElement).toBe(email);
    });
  });
});
