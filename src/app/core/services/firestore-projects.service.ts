import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Project } from '../../models/project.model';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreProjectsService {
  private readonly collectionName = 'projects';

  /**
   * Obtener todos los proyectos
   */
  getAll(): Observable<Project[]> {
    return from(
      getDocs(collection(db, this.collectionName))
    ).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project))
      )
    );
  }

  /**
   * Obtener un proyecto por ID
   */
  getById(id: string): Observable<Project | undefined> {
    return from(
      getDoc(doc(db, this.collectionName, id))
    ).pipe(
      map(docSnapshot =>
        docSnapshot.exists()
          ? ({ id: docSnapshot.id, ...docSnapshot.data() } as Project)
          : undefined
      )
    );
  }

  /**
   * Obtener proyectos por categoría
   */
  getByCategory(category: string): Observable<Project[]> {
    return from(
      getDocs(
        query(
          collection(db, this.collectionName),
          where('category', 'array-contains', category)
        )
      )
    ).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project))
      )
    );
  }

  /**
   * Obtener proyectos agrupados por categoría
   */
  getGroupedByCategory(): Observable<Map<string, Project[]>> {
    return this.getAll().pipe(
      map(projects => {
        const grouped = new Map<string, Project[]>();
        projects.forEach(project => {
          const categories = Array.isArray(project.category)
            ? project.category
            : [project.category];
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

  /**
   * Crear un nuevo proyecto
   */
  create(project: Omit<Project, 'id'>): Observable<string> {
    return from(
      addDoc(collection(db, this.collectionName), {
        ...project,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    ).pipe(
      map(docRef => docRef.id)
    );
  }

  /**
   * Actualizar un proyecto existente
   */
  update(id: string, project: Partial<Project>): Observable<void> {
    return from(
      updateDoc(doc(db, this.collectionName, id), {
        ...project,
        updatedAt: Timestamp.now()
      })
    );
  }

  /**
   * Eliminar un proyecto
   */
  delete(id: string): Observable<void> {
    return from(
      deleteDoc(doc(db, this.collectionName, id))
    );
  }

  /**
   * Búsqueda personalizada
   */
  search(constraints: QueryConstraint[]): Observable<Project[]> {
    return from(
      getDocs(
        query(collection(db, this.collectionName), ...constraints)
      )
    ).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project))
      )
    );
  }
}
