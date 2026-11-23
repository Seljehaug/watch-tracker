import {afterNextRender, Component, computed, ElementRef, inject, Injector, input, signal, viewChild} from '@angular/core';
import {form, FormField, FormRoot} from '@angular/forms/signals';
import {PageHeader} from '../shared/page-header/page-header';
import {FormFieldWrapper} from '../shared/form-field/form-field';
import {LoginPostModel, loginPostModelSchema} from './login-post-model';
import {firstValueFrom} from 'rxjs';
import {AuthStore, isUnauthorized} from './auth-store';
import {FormFieldControl} from '../shared/form-field/form-field-control';
import {AlertError} from '../shared/alert-error/alert-error';
import {Router} from '@angular/router';

type LoginError = 'failed' | 'wrongCredentials' | null;

@Component({
  imports: [
    PageHeader,
    FormFieldWrapper,
    FormField,
    FormFieldControl,
    AlertError,
    FormRoot
  ],
  selector: 'app-login',
  styles: `
    button[type="submit"] {
      margin: 0 auto;
    }
  `,
  template: `
    <div class="container-inner-centered">
      <app-page-header heading="Log in"></app-page-header>

      <form [formRoot]="form">
        <app-form-field label="Email" [showErrors]="hasTriedToLogin()">
          <input type="email" [formField]="form.email" appFormFieldControl autocomplete="username"/>
        </app-form-field>

        <app-form-field label="Password" [showErrors]="hasTriedToLogin()">
          <input type="password" [formField]="form.password" appFormFieldControl autocomplete="current-password"/>
        </app-form-field>

        <button type="submit" [attr.aria-disabled]="form().submitting() || null">
          <span class="button-labels">
            <span [class.button-label-hidden]="form().submitting()">Log in</span>
            <span [class.button-label-hidden]="!form().submitting()">Logging in…</span>
          </span>
        </button>
      </form>

      @if (loginError() !== null) {
        <app-alert-error>
          @if (hasWrongCredentials()) {
            <p>Wrong email or password.</p>
          }
          @else if (loginHasFailed()) {
            <p>Something went wrong when trying to log in.</p>
          }
        </app-alert-error>
      }
    </div>
  `,
})
export class Login {
  private readonly authStore = inject(AuthStore);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  protected readonly hasTriedToLogin = signal(false);

  protected readonly loginError = signal<LoginError>(null);
  protected readonly hasWrongCredentials = computed(() => this.loginError() === 'wrongCredentials');
  protected readonly loginHasFailed = computed(() => this.loginError() === 'failed');

  protected readonly returnUrl = input<string>();

  private readonly model = signal<LoginPostModel>(this.createEmptyPostModel());

  protected readonly form = form<LoginPostModel>(this.model, loginPostModelSchema, {
    submission: {
      action: async (fieldTree) => {
        this.hasTriedToLogin.set(true);
        this.loginError.set(null);

        const postModel = fieldTree().value();

        try {
          await firstValueFrom(this.authStore.login(postModel));
        }
        catch (error: unknown) {
          if (isUnauthorized(error)) {
            this.loginError.set('wrongCredentials');
          }
          else {
            this.loginError.set('failed');
          }

          console.error('Could not log in user.', error);
          afterNextRender(
            () => { this.alertError()?.nativeElement.scrollIntoView({ block: 'nearest' }) },
            { injector: this.injector }
          );
          return;
        }

        await this.router.navigateByUrl(this.returnUrl() ?? '/');
      },
      onInvalid: (fieldTree) => {
        this.hasTriedToLogin.set(true);
        this.loginError.set(null);

        afterNextRender(
          () => fieldTree().errorSummary()[0]?.fieldTree().focusBoundControl(),
          { injector: this.injector }
        )
      }
    }
  });

  private readonly alertError = viewChild<AlertError, ElementRef<HTMLElement>>(AlertError, { read: ElementRef });

  private createEmptyPostModel(): LoginPostModel {
    return {
      email: '',
      password: ''
    }
  }
}
