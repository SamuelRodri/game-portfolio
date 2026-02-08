import { Injectable } from '@angular/core';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from '../config/firebase.config';
import { Observable, from, map, mergeMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {

  /**
   * Subir una imagen o video a Firebase Storage (DEPRECATED: usar Supabase)
   * @param projectId ID del proyecto
   * @param file Archivo a subir
   * @param type 'images' o 'videos'
   */
  uploadFile(projectId: string, file: File, type: 'images' | 'videos'): Observable<string> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `projects/${projectId}/${type}/${fileName}`;

    const storageRef = ref(storage, filePath);

    return from(uploadBytes(storageRef, file)).pipe(
      mergeMap(() => from(getDownloadURL(storageRef)))
    );
  }

  /**
   * Obtener URL descargable de un archivo
   */
  getDownloadURL(filePath: string): Observable<string> {
    return from(
      getDownloadURL(ref(storage, filePath))
    );
  }

  /**
   * Eliminar un archivo de Storage
   */
  deleteFile(filePath: string): Observable<void> {
    return from(
      deleteObject(ref(storage, filePath))
    );
  }

  /**
   * Listar todos los archivos de un proyecto
   */
  listProjectFiles(projectId: string): Observable<any[]> {
    return from(
      listAll(ref(storage, `projects/${projectId}`))
    ).pipe(
      map(result => result.items)
    );
  }

  /**
   * Versión simplificada: Subir archivo y retornar URL (DEPRECATED: usar Supabase)
   */
  uploadAndGetURL(projectId: string, file: File, type: 'images' | 'videos'): Observable<string> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `projects/${projectId}/${type}/${fileName}`;

    const storageRef = ref(storage, filePath);

    return from(uploadBytes(storageRef, file)).pipe(
      mergeMap(() => from(getDownloadURL(storageRef)))
    );
  }
}
