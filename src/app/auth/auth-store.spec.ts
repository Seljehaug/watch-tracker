import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from './auth-store';
import type { LoginPostModel } from './login-post-model';
import type { UserModel } from './user-model';

const user: UserModel = { email: 'test@example.com' };
const login: LoginPostModel = { email: 'test@example.com', password: 'a-long-test-password' };

describe('AuthStore', () => {
  let store: AuthStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpTesting = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthStore);
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

  // Answers the check the store starts when it is created.
  function answerCheck(answer: UserModel | { status: number; statusText: string }): void {
    const request = httpTesting.expectOne({ method: 'GET', url: '/api/auth/user' });
    if ('email' in answer) {
      request.flush(answer);
    } else {
      request.flush(null, answer);
    }
  }

  const unauthorized = { status: 401, statusText: 'Unauthorized' };
  const serverError = { status: 500, statusText: 'Internal Server Error' };

  describe('the check when it is created', () => {
    it('is checking until the server answers, then logged in with the user it returns', () => {
      expect(store.authState()).toEqual({ status: 'checking' });

      answerCheck(user);

      expect(store.authState()).toEqual({ status: 'loggedIn', user });
    });

    // A 401 is the server's answer for no login, not a failure.
    it('is logged out, not failed, when the server answers 401', () => {
      answerCheck(unauthorized);

      expect(store.authState()).toEqual({ status: 'loggedOut' });
    });

    it('has failed when the server answers with another error', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      answerCheck(serverError);

      expect(store.authState()).toEqual({ status: 'failed' });
    });
  });

  describe('login', () => {
    // A second subscription would send the password twice, and a wrong one would count twice
    // towards the lockout.
    it('sends nothing until the caller subscribes', () => {
      answerCheck(unauthorized);

      store.login(login);

      httpTesting.expectNone({ method: 'POST', url: '/api/auth/login' });
    });

    it('is logged in once the server says yes, and hands the user to the caller', async () => {
      answerCheck(unauthorized);
      const answer = firstValueFrom(store.login(login));

      const request = httpTesting.expectOne({ method: 'POST', url: '/api/auth/login' });
      expect(request.request.body).toEqual(login);
      expect(store.authState()).toEqual({ status: 'loggedOut' });
      request.flush(user);

      expect(await answer).toEqual(user);
      expect(store.authState()).toEqual({ status: 'loggedIn', user });
    });

    // The login page tells a wrong password from other failures by the status.
    it('stays logged out when the server refuses, and passes the 401 on', async () => {
      answerCheck(unauthorized);
      const answer = firstValueFrom(store.login(login));

      httpTesting.expectOne('/api/auth/login').flush(null, unauthorized);

      await expect(answer).rejects.toMatchObject({ status: 401 });
      expect(store.authState()).toEqual({ status: 'loggedOut' });
    });
  });

  describe('logout', () => {
    it('is logged out once the server has logged out', async () => {
      answerCheck(user);
      const answer = firstValueFrom(store.logout());

      const request = httpTesting.expectOne({ method: 'POST', url: '/api/auth/logout' });
      expect(store.authState()).toEqual({ status: 'loggedIn', user });
      request.flush(null, { status: 204, statusText: 'No Content' });

      await answer;
      expect(store.authState()).toEqual({ status: 'loggedOut' });
    });

    // The cookie had already expired: the user has what they asked for.
    it('counts a 401 as logged out', async () => {
      answerCheck(user);
      const answer = firstValueFrom(store.logout());

      httpTesting.expectOne('/api/auth/logout').flush(null, unauthorized);

      await expect(answer).resolves.toBeUndefined();
      expect(store.authState()).toEqual({ status: 'loggedOut' });
    });

    it('stays logged in when the logout fails, and passes the error on', async () => {
      answerCheck(user);
      const answer = firstValueFrom(store.logout());

      httpTesting.expectOne('/api/auth/logout').flush(null, serverError);

      await expect(answer).rejects.toMatchObject({ status: 500 });
      expect(store.authState()).toEqual({ status: 'loggedIn', user });
    });
  });
});
