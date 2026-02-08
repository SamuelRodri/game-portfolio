import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreProjectsService } from '../../core/services/firestore-projects.service';
import { SupabaseStorageService } from '../../core/services/supabase-storage.service';
import { Project } from '../../models/project.model';
import { map } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1>Panel de Administración</h1>
        <button (click)="logout()" class="btn-logout">Cerrar Sesión</button>
      </div>

      <div class="admin-content">
        <!-- Formulario para crear/editar proyecto -->
        <div class="form-section">
          <h2>{{ editingId ? 'Editar Proyecto' : 'Agregar Nuevo Proyecto' }}</h2>

          <form [formGroup]="projectForm" (ngSubmit)="onSubmit()">
            <!-- Fila 1: Título y Motor -->
            <div class="form-row">
              <div class="form-group">
                <label for="title">Título *</label>
                <input type="text" id="title" formControlName="title" required />
              </div>
              <div class="form-group">
                <label for="engine">Motor *</label>
                <input type="text" id="engine" formControlName="engine" required />
              </div>
            </div>

            <!-- Fila 2: Lenguaje, Año y Orden -->
            <div class="form-row">
              <div class="form-group">
                <label for="language">Lenguaje *</label>
                <input type="text" id="language" formControlName="language" required />
              </div>
              <div class="form-group">
                <label for="year">Año *</label>
                <input type="number" id="year" formControlName="year" required />
              </div>
              <div class="form-group">
                <label for="order">Orden en Carrusel</label>
                <input type="number" id="order" formControlName="order" min="1" placeholder="Menor = primero" />
              </div>
            </div>

            <!-- Categorías -->
            <div class="form-group">
              <label>Categorías *</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" value="proyecto" (change)="onCategoryChange($event, 'proyecto')" />
                  Proyecto
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" value="gamejam" (change)="onCategoryChange($event, 'gamejam')" />
                  Game Jam
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" value="vr" (change)="onCategoryChange($event, 'vr')" />
                  VR
                </label>
              </div>
            </div>

            <!-- Estado -->
            <div class="form-group">
              <label for="status">Estado *</label>
              <select id="status" formControlName="status" required>
                <option value="">Selecciona un estado</option>
                <option value="terminado">Terminado</option>
                <option value="en-desarrollo">En Desarrollo</option>
                <option value="pausado">Pausado</option>
                <option value="prototipo">Prototipo</option>
              </select>
            </div>

            <!-- Descripción corta -->
            <div class="form-group">
              <label for="shortDescription">Descripción Corta *</label>
              <textarea
                id="shortDescription"
                formControlName="shortDescription"
                rows="2"
                required
              ></textarea>
            </div>

            <!-- Descripción larga -->
            <div class="form-group">
              <label for="longDescription">Descripción Larga *</label>
              <textarea
                id="longDescription"
                formControlName="longDescription"
                rows="4"
                required
              ></textarea>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label for="tags">Tags (separados por comas)</label>
              <input
                type="text"
                id="tags"
                placeholder="tag1, tag2, tag3"
                (change)="onTagsChange($event)"
              />
            </div>

            <!-- Links -->
            <div class="form-group">
              <label>Enlaces</label>
              <div class="form-row">
                <div class="form-group-nested">
                  <label for="github">GitHub</label>
                  <input type="url" id="github" formControlName="github" />
                </div>
                <div class="form-group-nested">
                  <label for="itch">Itch.io</label>
                  <input type="url" id="itch" formControlName="itch" />
                </div>
                <div class="form-group-nested">
                  <label for="demo">Demo</label>
                  <input type="url" id="demo" formControlName="demo" />
                </div>
              </div>
            </div>

<!-- Subir a Supabase Storage -->
            <div class="form-group">
              <label for="supabaseImageInput">☁️ Subir Imágenes a Supabase Storage</label>
              <small class="text-muted">Debes guardar el proyecto primero, luego podrás subir archivos</small>
              <div class="supabase-upload-group">
                <input
                  type="file"
                  id="supabaseImageInput"
                  multiple
                  accept="image/*"
                  (change)="onSupabaseFilesSelected($event)"
                  [disabled]="!editingId || isUploadingToSupabase"
                  class="file-input"
                />
                <button
                  type="button"
                  (click)="uploadSupabaseFiles()"
                  [disabled]="!editingId || selectedSupabaseFiles.length === 0 || isUploadingToSupabase"
                  class="btn-upload-supabase"
                >
                  {{ isUploadingToSupabase ? '⏳ Subiendo...' : '☁️ Subir a Supabase' }}
                </button>
              </div>
              <div *ngIf="selectedSupabaseFiles.length > 0" class="selected-files">
                <small>{{ selectedSupabaseFiles.length }} archivo(s) seleccionado(s)</small>
              </div>
            </div>

<!-- URLs de Imágenes -->
            <div class="form-group">
              <label for="imageUrl">🖼️ URLs de Imágenes</label>
              <div class="image-url-input-group">
                <input
                  type="url"
                  id="imageUrl"
                  #imageUrlInput
                  placeholder="https://ejemplo.com/imagen.jpg"
                  class="image-url-input"
                />
                <button
                  type="button"
                  (click)="addImageUrl()"
                  class="btn-add-image"
                >
                  ➕ Añadir
                </button>
              </div>
              <small class="text-muted">Pega la URL de una imagen y haz clic en "Añadir"</small>
            </div>

            <!-- Imágenes agregadas -->
            <div class="form-group" *ngIf="projectImages.length > 0">
              <label>📸 Imágenes en el Proyecto ({{ projectImages.length }})</label>
              <div class="uploaded-images">
                <div class="image-item" *ngFor="let image of projectImages; let i = index">
                  <img [src]="image" [alt]="'Imagen ' + (i+1)" />
                  <button
                    type="button"
                    (click)="removeProjectImage(i)"
                    class="btn-remove-image"
                  >✕</button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="video">URL del Video</label>
              <input type="url" id="video" formControlName="video" />
            </div>

            <!-- Botones -->
            <div class="button-group">
              <button type="submit" [disabled]="projectForm.invalid || isSubmitting" class="btn-submit">
                {{ isSubmitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear') }} Proyecto
              </button>
              <button type="button" (click)="resetForm()" class="btn-reset">
                Limpiar
              </button>
              <button type="button" (click)="cancelEdit()" *ngIf="editingId" class="btn-cancel">
                Cancelar
              </button>
            </div>
          </form>

          <div class="success" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Lista de proyectos -->
        <div class="projects-section">
          <h2>Proyectos Existentes</h2>
          <div class="projects-list">
            <div class="project-card" *ngFor="let project of projects$ | async">
              <h3>{{ project.title }}</h3>
              <p class="meta">{{ project.engine }} • {{ project.year }}</p>
              <p class="status" [ngClass]="project.status">{{ project.status }}</p>
              <p class="short-desc">{{ project.shortDescription }}</p>
              <div class="card-buttons">
                <button (click)="onEdit(project)" class="btn-edit">Editar</button>
                <button (click)="onDelete(project.id)" class="btn-delete">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;

      h1 {
        margin: 0;
        color: #333;
      }
    }

    .btn-logout {
      padding: 10px 20px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        background: #c0392b;
      }
    }

    .admin-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .form-section, .projects-section {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 10px;
      border: 1px solid #e0e0e0;

      h2 {
        margin-top: 0;
        color: #333;
        margin-bottom: 20px;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;

      label {
        margin-bottom: 8px;
        color: #333;
        font-weight: 500;
        font-size: 14px;
      }

      input, select, textarea {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-family: inherit;
        font-size: 14px;

        &:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 5px rgba(102, 126, 234, 0.2);
        }
      }

      textarea {
        resize: vertical;
      }
    }

    .form-group-nested {
      label {
        margin-bottom: 5px;
        font-size: 13px;
      }

      input {
        padding: 8px;
        font-size: 13px;
      }
    }

    .checkbox-group {
      display: flex;
      gap: 15px;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        input[type="checkbox"] {
          cursor: pointer;
        }
      }
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 10px;

      button {
        padding: 12px 20px;
        border: none;
        border-radius: 5px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .btn-submit {
      background: #667eea;
      color: white;
      flex: 1;

      &:hover:not(:disabled) {
        background: #5568d3;
      }
    }

    .btn-reset {
      background: #95a5a6;
      color: white;

      &:hover {
        background: #7f8c8d;
      }
    }

    .btn-cancel {
      background: #f39c12;
      color: white;

      &:hover {
        background: #e67e22;
      }
    }

    .success {
      background: #d4edda;
      color: #155724;
      padding: 12px;
      border-radius: 5px;
      border-left: 4px solid #28a745;
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 5px;
      border-left: 4px solid #f5c6cb;
    }

    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: 800px;
      overflow-y: auto;
    }

    .project-card {
      background: white;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      h3 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 16px;
      }

      .meta {
        margin: 5px 0;
        font-size: 12px;
        color: #999;
      }

      .status {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        margin: 8px 0;

        &.terminado { background: #d4edda; color: #155724; }
        &.en-desarrollo { background: #cce5ff; color: #004085; }
        &.pausado { background: #fff3cd; color: #856404; }
        &.prototipo { background: #e7d4f5; color: #5a1e7a; }
      }

      .short-desc {
        margin: 8px 0;
        font-size: 13px;
        color: #666;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .card-buttons {
      display: flex;
      gap: 8px;
      margin-top: 12px;

      button {
        flex: 1;
        padding: 6px;
        border: none;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }
    }

    .btn-edit {
      background: #667eea;
      color: white;

      &:hover {
        background: #5568d3;
      }
    }

    .btn-delete {
      background: #e74c3c;
      color: white;

      &:hover {
        background: #c0392b;
      }
    }

    .image-url-input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .image-url-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 5px rgba(102, 126, 234, 0.2);
      }
    }

    .btn-add-image {
      background: #667eea;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      white-space: nowrap;

      &:hover {
        background: #5568d3;
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }

    .supabase-upload-group {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 10px;

      .file-input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 5px;
        cursor: pointer;

        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      }

      .btn-upload-supabase {
        background: #27ae60;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        white-space: nowrap;

        &:hover:not(:disabled) {
          background: #229954;
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
    }

    .selected-files {
      margin-top: 5px;
      color: #666;
    }

    .uploaded-images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }

    .image-item {
      position: relative;
      border-radius: 5px;
      overflow: hidden;
      border: 2px solid #ddd;
      background: #f5f5f5;

      img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        display: block;
      }

      &:hover {
        border-color: #e74c3c;
      }

      &:hover .btn-remove-image {
        opacity: 1;
      }
    }

    .btn-remove-image {
      position: absolute;
      top: 5px;
      right: 5px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 50%;
      width: 25px;
      height: 25px;
      cursor: pointer;
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.2s;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #c0392b;
      }
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  projectForm!: FormGroup;
  projects$!: Observable<Project[]>;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  editingId: string | null = null;
  private selectedCategories: string[] = [];
  projectImages: string[] = [];
  isUploadingToSupabase = false;
  uploadProgress: { [key: number]: number } = {};
  selectedSupabaseFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firestoreService: FirestoreProjectsService,
    private supabaseStorageService: SupabaseStorageService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.projects$ = this.firestoreService.getAll();
  }

  private initForm(): void {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      engine: ['', Validators.required],
      language: ['', Validators.required],
      year: ['', Validators.required],
      order: [''],
      status: ['', Validators.required],
      shortDescription: ['', Validators.required],
      longDescription: ['', Validators.required],
      video: [''],
      github: [''],
      itch: [''],
      demo: ['']
    });
  }

  onCategoryChange(event: Event, category: string): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedCategories.includes(category)) {
        this.selectedCategories.push(category);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(c => c !== category);
    }
  }

  onTagsChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tags = input.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    // Guardamos los tags en memory para usar en onSubmit
  }

  onImageFilesSelected(event: Event): void {
    // Este método ya no se usa
  }

  addImageUrl(): void {
    const input = document.getElementById('imageUrl') as HTMLInputElement;
    const url = input?.value.trim();

    if (!url) {
      this.errorMessage = 'Escribe una URL de imagen';
      return;
    }

    if (!this.isValidUrl(url)) {
      this.errorMessage = 'URL inválida. Debe comenzar con http:// o https://';
      return;
    }

    if (this.projectImages.includes(url)) {
      this.errorMessage = 'Esta imagen ya está en la lista';
      return;
    }

    this.projectImages.push(url);
    if (input) input.value = '';
    this.errorMessage = null;
    this.successMessage = '✅ Imagen añadida';

    setTimeout(() => {
      this.successMessage = null;
    }, 2000);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  async uploadProjectImages(): Promise<void> {
    // Este método ya no se usa - reemplazado por addImageUrl
  }

  removeProjectImage(index: number): void {
    this.projectImages.splice(index, 1);
  }

  onSubmit(): void {
    if (this.projectForm.invalid || this.selectedCategories.length === 0) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios y selecciona al menos una categoría';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.projectForm.value;
    const projectData: Omit<Project, 'id'> = {
      title: formValue.title,
      engine: formValue.engine,
      language: formValue.language,
      year: formValue.year,
      category: this.selectedCategories as any,
      status: formValue.status,
      shortDescription: formValue.shortDescription,
      longDescription: formValue.longDescription,
      tags: [],
      images: this.projectImages,
      video: formValue.video || null,
      order: formValue.order ? parseInt(formValue.order, 10) : undefined,
      links: {
        github: formValue.github || null,
        itch: formValue.itch || null,
        demo: formValue.demo || null
      }
    };

    const operation$ = this.editingId
      ? this.firestoreService.update(this.editingId, projectData).pipe(
          map(() => undefined)
        )
      : this.firestoreService.create(projectData).pipe(
          map(() => undefined)
        );

    operation$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.editingId
          ? 'Proyecto actualizado exitosamente'
          : 'Proyecto creado exitosamente';
        this.resetForm();
        this.editingId = null;
        this.projects$ = this.firestoreService.getAll();
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Error al guardar el proyecto: ' + error.message;
        console.error('Error:', error);
      }
    });
  }

  onEdit(project: Project): void {
    this.editingId = project.id;
    this.selectedCategories = Array.isArray(project.category) ? [...project.category] : [project.category];
    this.projectImages = project.images.map(img => typeof img === 'string' ? img : img.url);

    this.projectForm.patchValue({
      title: project.title,
      engine: project.engine,
      language: project.language,
      year: project.year,
      order: project.order || '',
      status: project.status,
      shortDescription: project.shortDescription,
      longDescription: project.longDescription,
      video: project.video || '',
      github: project.links.github || '',
      itch: project.links.itch || '',
      demo: project.links.demo || ''
    });

    // Scroll al formulario para mejor UX
    const formSection = document.querySelector('.form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onDelete(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      this.firestoreService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Proyecto eliminado exitosamente';
          this.projects$ = this.firestoreService.getAll();
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error: Error) => {
          this.errorMessage = 'Error al eliminar el proyecto: ' + error.message;
        }
      });
    }
  }

  resetForm(): void {
    this.projectForm.reset();
    this.selectedCategories = [];
    this.projectImages = [];
    this.editingId = null;
    this.selectedSupabaseFiles = [];
    this.uploadProgress = {};
    const imageUrlInput = document.getElementById('imageUrl') as HTMLInputElement;
    if (imageUrlInput) imageUrlInput.value = '';
    const supabaseInput = document.getElementById('supabaseImageInput') as HTMLInputElement;
    if (supabaseInput) supabaseInput.value = '';
  }

  onSupabaseFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedSupabaseFiles = Array.from(input.files);
    }
  }

  uploadSupabaseFiles(): void {
    if (this.selectedSupabaseFiles.length === 0) {
      this.errorMessage = 'Por favor selecciona al menos una imagen';
      return;
    }

    if (!this.editingId) {
      this.errorMessage = 'Debes guardar el proyecto antes de subir imágenes';
      return;
    }

    this.isUploadingToSupabase = true;
    this.errorMessage = null;
    this.successMessage = null;

    const uploadObservables = this.selectedSupabaseFiles.map((file, index) => {
      return this.supabaseStorageService.uploadAndGetURL(this.editingId!, file, 'images').pipe(
        map(url => {
          this.uploadProgress[index] = 100;
          return url;
        })
      );
    });

    forkJoin(uploadObservables).subscribe({
      next: (urls: string[]) => {
        this.isUploadingToSupabase = false;
        this.projectImages.push(...urls);
        this.successMessage = urls.length + ' imagen(es) subida(s) correctamente a Supabase';
        this.selectedSupabaseFiles = [];
        this.uploadProgress = {};
        const input = document.getElementById('supabaseImageInput') as HTMLInputElement;
        if (input) input.value = '';
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error: Error) => {
        this.isUploadingToSupabase = false;
        this.errorMessage = 'Error al subir imagenes: ' + error.message;
        console.error('Error de carga:', error);
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error: Error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }
}
