import { Injectable } from '@angular/core';
import { ProjectsService } from './projects.service';
import { FirestoreProjectsService } from './firestore-projects.service';
import { Project } from '../../models/project.model';
import { Observable } from 'rxjs';
import { QueryConstraint } from 'firebase/firestore';

/**
 * Servicio adaptador que permite cambiar entre fuentes de datos fácilmente
 * - USE_FIRESTORE: si es true, usa Firestore; si es false, usa JSON local
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectsDataService {
  // CAMBIA ESTO A TRUE PARA USAR FIRESTORE
  private readonly USE_FIRESTORE = true;

  constructor(
    private httpService: ProjectsService,
    private firestoreService: FirestoreProjectsService
  ) {}

  getAll(): Observable<Project[]> {
    return this.USE_FIRESTORE
      ? this.firestoreService.getAll()
      : this.httpService.getAll();
  }

  getById(id: string): Observable<Project | undefined> {
    return this.USE_FIRESTORE
      ? this.firestoreService.getById(id)
      : this.httpService.getById(id);
  }

  getByCategory(category: string): Observable<Project[]> {
    return this.USE_FIRESTORE
      ? this.firestoreService.getByCategory(category)
      : this.httpService.getByCategory(category);
  }

  getGroupedByCategory(): Observable<Map<string, Project[]>> {
    return this.USE_FIRESTORE
      ? this.firestoreService.getGroupedByCategory()
      : this.httpService.getGroupedByCategory();
  }
}
