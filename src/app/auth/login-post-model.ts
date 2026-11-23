import {email, required, schema} from '@angular/forms/signals';

export interface LoginPostModel {
  readonly email: string;
  readonly password: string;
}

export const loginPostModelSchema = schema<LoginPostModel>((path) => {
  required(path.email, { message: 'Email is required.' });

  email(path.email, { message: 'Email must be a valid email address.' });

  required(path.password, { message: 'Password is required.' });
});
