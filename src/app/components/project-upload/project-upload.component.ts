import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreProjectsService } from '../../core/services/firestore-projects.service';
import { SupabaseStorageService } from '../../core/services/supabase-storage.service';
import { Project } from '../../models/project.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-project-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <h1>📁 Gestor de Proyectos Firebase</h1>

      <div class="row">
        <!-- Crear/Editar Proyecto -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>{{ editingId ? 'Editar Proyecto' : 'Crear Nuevo Proyecto' }}</h5>
            </div>
            <div class="card-body">
              <form (ngSubmit)="saveProject()">
                <div class="mb-3">
                  <label class="form-label">Título</label>
                  <input class="form-control" [(ngModel)]="projectForm.title" name="title" required />
                </div>

                <div class="mb-3">
                  <label class="form-label">Motor</label>
                  <input class="form-control" [(ngModel)]="projectForm.engine" name="engine" />
                </div>

                <div class="mb-3">
                  <label class="form-label">Imágenes</label>
                  <input
                    class="form-control"
                    type="file"
                    multiple
                    accept="image/*"
                    (change)="onImageSelected($event)"
                  />
                  <div class="mt-2">
                    <span *ngIf="imagesToUpload.length > 0" class="badge bg-info">
                      {{ imagesToUpload.length }} imágenes seleccionadas
                    </span>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Videos</label>
                  <input
                    class="form-control"
                    type="file"
                    multiple
                    accept="video/*"
                    (change)="onVideoSelected($event)"
                  />
                  <div class="mt-2">
                    <span *ngIf="videosToUpload.length > 0" class="badge bg-danger">
                      {{ videosToUpload.length }} videos seleccionados
                    </span>
                  </div>
                </div>

                <button class="btn btn-primary w-100" type="submit" [disabled]="isUploading">
                  {{ isUploading ? '⏳ Subiendo...' : '💾 Guardar Proyecto' }}
                </button>

                <button
                  class="btn btn-secondary w-100 mt-2"
                  type="button"
                  (click)="resetForm()"
                  *ngIf="editingId"
                >
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Lista de Proyectos -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>📋 Proyectos</h5>
            </div>
            <div class="card-body" style="max-height: 500px; overflow-y: auto">
              <div *ngIf="(projects$ | async) as projects" class="list-group">
                <div *ngIf="projects.length === 0" class="alert alert-info">
                  No hay proyectos aún
                </div>
                <div
                  *ngFor="let project of projects"
                  class="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h6 class="mb-0">{{ project.title }}</h6>
                    <small class="text-muted">{{ project.engine }}</small>
                  </div>
                  <div class="btn-group btn-group-sm" role="group">
                    <button
                      class="btn btn-warning"
                      (click)="editProject(project)"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      class="btn btn-danger"
                      (click)="deleteProject(project.id)"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensajes -->
      <div *ngIf="successMessage" class="alert alert-success mt-3">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger mt-3">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
    }
  `]
})
export class ProjectUploadComponent {
  projects$: Observable<Project[]>;

  projectForm: Partial<Project> = {
    title: '',
    engine: '',
    year: new Date().getFullYear(),
    status: 'terminado',
    category: [],
    tags: [],
    images: [],
    links: {}
  };

  imagesToUpload: File[] = [];
  videosToUpload: File[] = [];
  isUploading = false;
  editingId: string | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private projectsService: FirestoreProjectsService,
    private storageService: SupabaseStorageService
  ) {
    this.projects$ = this.projectsService.getAll();
  }

  onImageSelected(event: any) {
    this.imagesToUpload = Array.from(event.target.files);
  }

  onVideoSelected(event: any) {
    this.videosToUpload = Array.from(event.target.files);
  }

  async saveProject() {
    if (!this.projectForm.title) {
      this.errorMessage = 'Por favor ingresa un título';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let projectId = this.editingId || 'temp-' + Date.now();
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      // Subir imágenes
      for (const file of this.imagesToUpload) {
        try {
          const url = await this.uploadFile(projectId, file, 'images');
          imageUrls.push(url);
        } catch (error) {
          console.error('Error al subir imagen:', error);
        }
      }

      // Subir videos
      for (const file of this.videosToUpload) {
        try {
          const url = await this.uploadFile(projectId, file, 'videos');
          videoUrls.push(url);
        } catch (error) {
          console.error('Error al subir video:', error);
        }
      }

      // Actualizar proyecto con URLs
      const projectToSave: Omit<Project, 'id'> = {
        title: this.projectForm.title || 'Sin título',
        engine: this.projectForm.engine || '',
        language: this.projectForm.language || '',
        year: this.projectForm.year || new Date().getFullYear(),
        category: (this.projectForm.category as any) || [],
        status: (this.projectForm.status as any) || 'terminado',
        shortDescription: this.projectForm.shortDescription || '',
        longDescription: this.projectForm.longDescription || '',
        tags: this.projectForm.tags || [],
        images: [
          ...(this.projectForm.images || []),
          ...imageUrls.map(url => ({ type: 'image' as const, url })),
          ...videoUrls.map(url => ({ type: 'video' as const, url }))
        ],
        links: this.projectForm.links || {}
      };

      if (this.editingId) {
        await this.projectsService.update(this.editingId, projectToSave).toPromise();
      } else {
        await this.projectsService.create(projectToSave).toPromise();
      }

      this.successMessage = '✅ Proyecto guardado exitosamente';
      this.resetForm();
      this.projects$ = this.projectsService.getAll();
    } catch (error) {
      this.errorMessage = '❌ Error al guardar el proyecto: ' + (error as any).message;
    } finally {
      this.isUploading = false;
    }
  }

  private async uploadFile(projectId: string, file: File, type: 'images' | 'videos'): Promise<string> {
    return new Promise((resolve, reject) => {
      this.storageService.uploadAndGetURL(projectId, file, type).subscribe(
        url => resolve(url),
        error => reject(error)
      );
    });
  }

  editProject(project: Project) {
    this.editingId = project.id;
    this.projectForm = { ...project };
    this.imagesToUpload = [];
    this.videosToUpload = [];
  }

  resetForm() {
    this.projectForm = {
      title: '',
      engine: '',
      year: new Date().getFullYear(),
      status: 'terminado',
      category: [],
      tags: [],
      images: [],
      links: {}
    };
    this.imagesToUpload = [];
    this.videosToUpload = [];
    this.editingId = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  deleteProject(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      this.projectsService.delete(id).subscribe(() => {
        this.successMessage = '✅ Proyecto eliminado';
        this.projects$ = this.projectsService.getAll();
      });
    }
  }
}
