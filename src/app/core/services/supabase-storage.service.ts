import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.config';
import { Observable, from, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseStorageService {
  private readonly bucketName = 'project-media';

  /**
   * Subir archivo (imagen o video) a Supabase Storage
   * Automáticamente genera URL pública
   */
  uploadAndGetURL(projectId: string, file: File, type: 'images' | 'videos'): Observable<string> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${projectId}/${type}/${fileName}`;

    console.log('📤 Iniciando carga:', { projectId, fileName, filePath, bucketName: this.bucketName });

    return from(
      supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
    ).pipe(
      tap(response => {
        console.log('📦 Respuesta del servidor:', response);
      }),
      map(response => {
        if (response.error) {
          console.error('❌ Error de carga:', response.error);
          throw new Error(`Error de carga: ${response.error.message}`);
        }

        if (!response.data) {
          throw new Error('No se recibió confirmación del servidor');
        }

        console.log('✅ Archivo subido:', response.data);

        // Generar URL pública
        const { data } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath);

        console.log('🔗 URL pública generada:', data.publicUrl);
        return data.publicUrl;
      })
    );
  }

  /**
   * Obtener URL pública de un archivo
   */
  getPublicURL(projectId: string, fileName: string, type: 'images' | 'videos'): string {
    const filePath = `${projectId}/${type}/${fileName}`;
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Eliminar un archivo
   */
  deleteFile(projectId: string, fileName: string, type: 'images' | 'videos'): Observable<void> {
    const filePath = `${projectId}/${type}/${fileName}`;

    return from(
      supabase.storage
        .from(this.bucketName)
        .remove([filePath])
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
      })
    );
  }

  /**
   * Listar todos los archivo de un proyecto
   */
  listProjectFiles(projectId: string): Observable<any[]> {
    return from(
      supabase.storage
        .from(this.bucketName)
        .list(projectId)
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data || [];
      })
    );
  }

  /**
   * Listar archivos de una categoría específica
   */
  listCategoryFiles(projectId: string, type: 'images' | 'videos'): Observable<any[]> {
    return from(
      supabase.storage
        .from(this.bucketName)
        .list(`${projectId}/${type}`)
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data || [];
      })
    );
  }
}
