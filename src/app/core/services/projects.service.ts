import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Project } from '../../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private readonly dataUrl = 'data/projects.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.dataUrl);
  }

  getById(id: string): Observable<Project | undefined> {
    return this.getAll().pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }
}
