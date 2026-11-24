import {afterNextRender, Component, computed, ElementRef, inject, Injector, signal, viewChild} from '@angular/core';
import {PageHeader} from '../shared/page-header/page-header';
import {AuthStore} from '../auth/auth-store';
import {firstValueFrom} from 'rxjs';
import {Router} from '@angular/router';
import {AlertError} from '../shared/alert-error/alert-error';

@Component({
  imports: [
    PageHeader,
    AlertError
  ],
  selector: 'app-account',
  styles: `
    section {
      margin-top: var(--spacing-1);
    }
  `,
  template: `
    <div class="container-inner-centered">
      <app-page-header heading="Account"/>

      <section>
        @if (email() !== null) {
          <h2>Logged in as</h2>
          <p>{{ email() }}</p>
        }
        @else if (authCheckHasFailed()) {
          <p>Couldn't check who is logged in. Reload the page to try again.</p>
        }

        <button type="button" class="button button-secondary spacing-top-1" [attr.aria-disabled]="isLoggingOut() || null" (click)="logout()">
          <span class="button-labels">
            <span [class.button-label-hidden]="isLoggingOut()">Log out</span>
            <span [class.button-label-hidden]="!isLoggingOut()">Logging out…</span>
          </span>
        </button>
      </section>

      @if (logoutHasFailed()) {
        <app-alert-error class="spacing-top-1">
          <p>Couldn't log out.</p>
        </app-alert-error>
      }
    </div>
  `,
})
export class Account {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly email = computed(() => {
    const authState = this.authStore.authState();

    if (authState.status === 'loggedIn') {
      return authState.user.email;
    }

    return null;
  });

  protected readonly authCheckHasFailed = computed(() => this.authStore.authState().status === 'failed');

  protected readonly isLoggingOut = signal(false);
  protected readonly logoutHasFailed = signal(false);

  private readonly alertError = viewChild<AlertError, ElementRef<HTMLElement>>(AlertError, { read: ElementRef });

  protected async logout() {
    if (this.isLoggingOut()) return;

    this.logoutHasFailed.set(false);
    this.isLoggingOut.set(true);

    try {
      await firstValueFrom(this.authStore.logout());
    }
    catch (error: unknown) {
      this.isLoggingOut.set(false);
      this.logoutHasFailed.set(true);
      console.error('Could not log out.', error);

      afterNextRender(
        () => { this.alertError()?.nativeElement.scrollIntoView({ block: 'nearest' }) },
        { injector: this.injector }
      );

      return;
    }

    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
