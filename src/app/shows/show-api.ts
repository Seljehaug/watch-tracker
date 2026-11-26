import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShowId, ShowPostModel, TrackedShow } from './tracked-show';

@Service()
export class ShowApi {
  private readonly http = inject(HttpClient);

  getShows(): Observable<TrackedShow[]> {
    return this.http.get<TrackedShow[]>('/api/shows');
  }

  addShow(postModel: ShowPostModel): Observable<TrackedShow> {
    return this.http.post<TrackedShow>('/api/shows', postModel);
  }

  updateShow(id: ShowId, postModel: ShowPostModel): Observable<TrackedShow> {
    return this.http.put<TrackedShow>(`/api/shows/${id}`, postModel);
  }

  deleteShow(id: ShowId): Observable<void> {
    return this.http.delete<void>(`/api/shows/${id}`);
  }

  stepToPreviousEpisode(id: ShowId): Observable<TrackedShow> {
    return this.http.post<TrackedShow>(`/api/shows/${id}/previous-episode`, null);
  }

  stepToNextEpisode(id: ShowId): Observable<TrackedShow> {
    return this.http.post<TrackedShow>(`/api/shows/${id}/next-episode`, null);
  }
}
