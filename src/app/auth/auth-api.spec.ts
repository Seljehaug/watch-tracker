import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';
import type { LoginPostModel } from './login-post-model';
import type { UserModel } from './user-model';

const user: UserModel = { email: 'test@example.com' };

describe('AuthApi', () => {
  let api: AuthApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    api = TestBed.inject(AuthApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('gets the logged-in user with GET /api/auth/user', async () => {
    const answer = firstValueFrom(api.getUser());

    httpTesting.expectOne({ method: 'GET', url: '/api/auth/user' }).flush(user);

    expect(await answer).toEqual(user);
  });

  it('logs in with POST /api/auth/login, sending the email and the password', async () => {
    const login: LoginPostModel = { email: 'test@example.com', password: 'a-long-test-password' };
    const answer = firstValueFrom(api.login(login));

    const request = httpTesting.expectOne({ method: 'POST', url: '/api/auth/login' });
    expect(request.request.body).toEqual(login);
    request.flush(user);

    expect(await answer).toEqual(user);
  });

  it('logs out with POST /api/auth/logout', async () => {
    const answer = firstValueFrom(api.logout());

    httpTesting
      .expectOne({ method: 'POST', url: '/api/auth/logout' })
      .flush(null, { status: 204, statusText: 'No Content' });

    await expect(answer).resolves.toBeNull();
  });

  // The store decides what a 401 means: logged out on /user, a wrong password on /login.
  it('passes a 401 on as an error', async () => {
    const answer = firstValueFrom(api.getUser());

    httpTesting
      .expectOne('/api/auth/user')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(answer).rejects.toMatchObject({ status: 401 });
  });
});
