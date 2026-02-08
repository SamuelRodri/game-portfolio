import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FirestoreProjectsService } from '../../core/services/firestore-projects.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-migration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="card">
        <div class="card-header bg-warning">
          <h4>🚀 Migración de Proyectos a Firestore</h4>
        </div>
        <div class="card-body">
          <p class="text-muted">
            Este componente importará todos tus proyectos desde <code>projects.json</code> a Firestore.
            <strong>Esto debería ejecutarse una sola vez.</strong>
          </p>

          <div *ngIf="!migrationComplete">
            <button class="btn btn-primary btn-lg" (click)="migrateProjects()" [disabled]="isMigrating">
              {{ isMigrating ? '⏳ Migrando...' : '📤 Iniciar Migración' }}
            </button>
          </div>

          <div *ngIf="migrationComplete" class="alert alert-success mt-3">
            <h5>✅ ¡Migración Completada!</h5>
            <p>{{ successMessage }}</p>
            <button class="btn btn-secondary mt-2" (click)="reset()">Nueva Migración</button>
          </div>

          <div *ngIf="errorMessage" class="alert alert-danger mt-3">
            <h5>❌ Error durante la migración</h5>
            <p>{{ errorMessage }}</p>
          </div>

          <div *ngIf="projectsLoaded.length > 0" class="mt-4">
            <h5>📋 Proyectos a importar ({{ projectsLoaded.length }}):</h5>
            <ul class="list-group">
              <li class="list-group-item" *ngFor="let project of projectsLoaded">
                <strong>{{ project.title }}</strong>
                <br />
                <small class="text-muted">{{ project.engine }} • {{ project.year }}</small>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MigrationComponent {
  isMigrating = false;
  migrationComplete = false;
  projectsLoaded: Project[] = [];
  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private firestoreService: FirestoreProjectsService
  ) {
    this.loadProjects();
  }

  loadProjects() {
    this.http.get<Project[]>('./assets/data/projects.json').subscribe({
      next: (projects) => {
        this.projectsLoaded = projects;
      },
      error: (err) => {
        this.errorMessage = 'No se pudo cargar el archivo projects.json: ' + err.message;
      }
    });
  }

  async migrateProjects() {
    if (this.projectsLoaded.length === 0) {
      this.errorMessage = 'No hay proyectos para migrar';
      return;
    }

    this.isMigrating = true;
    this.errorMessage = '';
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const project of this.projectsLoaded) {
        try {
          // Crear el proyecto sin el ID (Firestore lo generará)
          const { id, ...projectData } = project;

          // Si queremos mantener el mismo ID, podemos usar update o directamente addDoc
          // Aquí usamos una forma alternativa para mantener los IDs
          await this.firestoreService.create(projectData).toPromise();
          successCount++;
        } catch (error) {
          console.error(`Error al migrar proyecto ${project.id}:`, error);
          errorCount++;
        }
      }

      this.migrationComplete = true;
      this.successMessage = `✅ Se migraron ${successCount} proyectos exitosamente.${
        errorCount > 0 ? ` ⚠️ ${errorCount} proyectos fallaron.` : ''
      }`;
    } catch (error) {
      this.errorMessage = 'Error general durante la migración: ' + (error as any).message;
    } finally {
      this.isMigrating = false;
    }
  }

  reset() {
    this.migrationComplete = false;
    this.isMigrating = false;
    this.projectsLoaded = [];
    this.successMessage = '';
    this.errorMessage = '';
    this.loadProjects();
  }
}
