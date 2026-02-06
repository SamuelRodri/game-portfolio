import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Project } from '../../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  private readonly dataUrl = './assets/data/projects.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.dataUrl);
  }

  getById(id: string): Observable<Project | undefined> {
    return this.getAll().pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }

  getByCategory(category: string): Observable<Project[]> {
    return this.getAll().pipe(
      map(projects => projects.filter(p =>
        Array.isArray(p.category) ? p.category.includes(category as any) : p.category === category
      ))
    );
  }

  getGroupedByCategory(): Observable<Map<string, Project[]>> {
    return this.getAll().pipe(
      map(projects => {
        const grouped = new Map<string, Project[]>();
        projects.forEach(project => {
          const categories = Array.isArray(project.category) ? project.category : [project.category];
          categories.forEach(cat => {
            if (!grouped.has(cat)) {
              grouped.set(cat, []);
            }
            grouped.get(cat)!.push(project);
          });
        });
        return grouped;
      })
    );
  }
}
