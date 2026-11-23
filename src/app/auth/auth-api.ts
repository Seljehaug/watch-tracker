import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UserModel} from './user-model';
import {LoginPostModel} from './login-post-model';

@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(postModel: LoginPostModel): Observable<UserModel> {
    return this.http.post<UserModel>('/api/auth/login', postModel);
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', null);
  }

  getUser(): Observable<UserModel> {
    return this.http.get<UserModel>('/api/auth/user');
  }
}
