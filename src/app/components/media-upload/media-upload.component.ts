import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreProjectsService } from '../../core/services/firestore-projects.service';
import { SupabaseStorageService } from '../../core/services/supabase-storage.service';
import { Project } from '../../models/project.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-media-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <div class="row">
        <!-- Selector de Proyecto -->
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5>📦 Proyectos</h5>
            </div>
            <div class="card-body" style="max-height: 600px; overflow-y: auto">
              <div *ngIf="(projects$ | async) as projects" class="list-group">
                <button
                  *ngFor="let project of projects"
                  class="list-group-item list-group-item-action"
                  [class.active]="selectedProject?.id === project.id"
                  (click)="selectProject(project)"
                >
                  <h6 class="mb-0">{{ project.title }}</h6>
                  <small class="text-muted">{{ project.engine }}</small>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Panel -->
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5>📤 Subir Archivos Multimedia</h5>
            </div>
            <div class="card-body">
              <div *ngIf="!selectedProject" class="alert alert-info">
                👈 Selecciona un proyecto para empezar
              </div>

              <div *ngIf="selectedProject">
                <h6 class="mb-3">Proyecto: <strong>{{ selectedProject.title }}</strong></h6>

                <!-- Upload de Imágenes -->
                <div class="mb-4">
                  <label class="form-label"><strong>🖼️ Imágenes</strong></label>
                  <input
                    class="form-control"
                    type="file"
                    multiple
                    accept="image/*"
                    (change)="onImagesSelected($event)"
                    id="imageInput"
                  />
                  <small class="text-muted">
                    {{ imagesToUpload.length }} imagen(es) seleccionada(s)
                  </small>
                </div>

                <!-- Upload de Videos -->
                <div class="mb-4">
                  <label class="form-label"><strong>🎬 Videos</strong></label>
                  <input
                    class="form-control"
                    type="file"
                    multiple
                    accept="video/*"
                    (change)="onVideosSelected($event)"
                    id="videoInput"
                  />
                  <small class="text-muted">
                    {{ videosToUpload.length }} video(s) seleccionado(s)
                  </small>
                </div>

                <!-- Botón Subir -->
                <button
                  class="btn btn-primary btn-lg w-100"
                  (click)="uploadFiles()"
                  [disabled]="isUploading || (imagesToUpload.length === 0 && videosToUpload.length === 0)"
                >
                  {{ isUploading ? '⏳ Subiendo...' : '📤 Subir Archivos' }}
                </button>

                <!-- Mensajes -->
                <div *ngIf="successMessage" class="alert alert-success mt-3">
                  {{ successMessage }}
                </div>
                <div *ngIf="errorMessage" class="alert alert-danger mt-3">
                  {{ errorMessage }}
                </div>
              </div>
            </div>
          </div>

          <!-- Vista Previa de Archivos Subidos -->
          <div class="card mt-4" *ngIf="selectedProject && selectedProject.images.length">
            <div class="card-header">
              <h5>📸 Archivos Actuales</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6 mb-3" *ngFor="let image of selectedProject.images">
                  <div class="card">
                    <img
                      *ngIf="isImageUrl(image)"
                      [src]="getMediaUrl(image)"
                      class="card-img-top"
                      style="max-height: 200px; object-fit: cover"
                    />
                    <video
                      *ngIf="isVideoUrl(image)"
                      style="max-height: 200px; width: 100%; object-fit: cover"
                      controls
                    >
                      <source [src]="getMediaUrl(image)" />
                    </video>
                    <div class="card-body p-2">
                      <small class="text-muted d-block text-truncate" [title]="getMediaUrl(image)">
                        {{ getMediaUrl(image).split('/').pop() }}
                      </small>
                      <button
                        class="btn btn-sm btn-danger mt-2"
                        (click)="deleteMedia(image)"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-group-item {
      cursor: pointer;
      transition: all 0.2s;
    }
    .list-group-item:hover {
      background-color: #f8f9fa;
    }
    .list-group-item.active {
      background-color: #0d6efd;
      color: white;
      border-color: #0d6efd;
    }
  `]
})
export class MediaUploadComponent implements OnInit {
  projects$!: Observable<Project[]>;
  selectedProject: Project | null = null;
  imagesToUpload: File[] = [];
  videosToUpload: File[] = [];
  isUploading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private projectsService: FirestoreProjectsService,
    private storageService: SupabaseStorageService
  ) {}

  ngOnInit() {
    this.projects$ = this.projectsService.getAll();
  }

  selectProject(project: Project) {
    this.selectedProject = project;
    this.imagesToUpload = [];
    this.videosToUpload = [];
    this.successMessage = '';
    this.errorMessage = '';
  }

  onImagesSelected(event: any) {
    this.imagesToUpload = Array.from(event.target.files);
  }

  onVideosSelected(event: any) {
    this.videosToUpload = Array.from(event.target.files);
  }

  async uploadFiles() {
    if (!this.selectedProject) {
      this.errorMessage = 'Selecciona un proyecto';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const newMedia: any[] = [];
    let uploadedCount = 0;
    let errorCount = 0;

    try {
      // Subir imágenes
      for (const file of this.imagesToUpload) {
        try {
          const url = await this.storageService
            .uploadAndGetURL(this.selectedProject.id, file, 'images')
            .toPromise();
          if (url) {
            newMedia.push(url);
            uploadedCount++;
          }
        } catch (error) {
          console.error('Error al subir imagen:', error);
          errorCount++;
        }
      }

      // Subir videos
      for (const file of this.videosToUpload) {
        try {
          const url = await this.storageService
            .uploadAndGetURL(this.selectedProject.id, file, 'videos')
            .toPromise();
          if (url) {
            newMedia.push({ type: 'video' as const, url });
            uploadedCount++;
          }
        } catch (error) {
          console.error('Error al subir video:', error);
          errorCount++;
        }
      }

      if (uploadedCount > 0) {
        // Actualizar Firestore
        const currentImages = this.selectedProject.images || [];
        const updatedProject = {
          images: [...currentImages, ...newMedia]
        };

        await this.projectsService
          .update(this.selectedProject.id, updatedProject)
          .toPromise();

        // Actualizar UI
        this.selectedProject.images = updatedProject.images;

        this.successMessage = `✅ ${uploadedCount} archivo(s) subido(s) exitosamente.${
          errorCount > 0 ? ` ⚠️ ${errorCount} fallaron.` : ''
        }`;

        // Limpiar inputs
        this.imagesToUpload = [];
        this.videosToUpload = [];
        (document.getElementById('imageInput') as any).value = '';
        (document.getElementById('videoInput') as any).value = '';
      } else if (errorCount > 0) {
        this.errorMessage = `❌ No se pudo subir ningún archivo. Errores: ${errorCount}`;
      }
    } catch (error) {
      this.errorMessage = '❌ Error al actualizar Firestore: ' + (error as any).message;
    } finally {
      this.isUploading = false;
    }
  }

  getMediaUrl(media: any): string {
    return typeof media === 'string' ? media : media.url;
  }

  isImageUrl(media: any): boolean {
    const url = this.getMediaUrl(media);
    return !url.includes('.mp4') && !url.includes('.webm') && !url.includes('.mov');
  }

  isVideoUrl(media: any): boolean {
    return typeof media === 'object' && media.type === 'video';
  }

  deleteMedia(media: any) {
    if (!this.selectedProject || !confirm('¿Eliminar este archivo?')) {
      return;
    }

    const mediaUrl = this.getMediaUrl(media);
    this.selectedProject.images = (this.selectedProject.images || []).filter(m => {
      const url = typeof m === 'string' ? m : m.url;
      return url !== mediaUrl;
    });

    // Actualizar Firestore
    this.projectsService
      .update(this.selectedProject.id, { images: this.selectedProject.images })
      .subscribe({
        next: () => {
          this.successMessage = '✅ Archivo eliminado';
        },
        error: (err) => {
          this.errorMessage = '❌ Error al eliminar: ' + err.message;
        }
      });
  }
}
