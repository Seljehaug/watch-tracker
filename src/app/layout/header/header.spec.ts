import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../app.routes';
import { AuthStore } from '../../auth/auth-store';
import { Header } from './header';

// Uses the app's real routes, so the tests also catch the login route losing its flag. The header
// needs no <router-outlet>: it reads the router's state, not the page.
describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  const links = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );

  async function navigate(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
  }

  // While the guard waits for the check the page isn't known, and the links would flash before
  // the login page.
  it('shows only the brand on the login page, also while the check is on its way', async () => {
    const navigation = TestBed.inject(Router).navigateByUrl('/login');
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    expect(links()).toEqual(['/']);

    httpTesting
      .expectOne('/api/auth/user')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await navigation;
    await fixture.whenStable();

    expect(links()).toEqual(['/']);
  });

  it('shows the links on a page that needs a login, and hides them again on the login page', async () => {
    const authStore = TestBed.inject(AuthStore);
    httpTesting.expectOne('/api/auth/user').flush({ email: 'test@example.com' });

    await navigate('/account');
    expect(links()).toEqual(['/', '/shows/add', '/account']);

    authStore.markAsLoggedOut();
    await navigate('/login');
    expect(links()).toEqual(['/']);
  });
});
