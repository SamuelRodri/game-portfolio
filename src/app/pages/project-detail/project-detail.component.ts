import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProjectsDataService } from '../../core/services/projects-data.service';
import { Project, MediaItem } from '../../models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {

  project?: Project;
  selectedImageIndex: number = 0;
  failedImages = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsDataService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectsService.getById(id).subscribe(p => {
        this.project = p;
        this.selectedImageIndex = 0;
      });
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.project?.images) return;

    if (event.key === 'ArrowLeft') {
      this.previousMedia();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.nextMedia();
      event.preventDefault();
    }
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  nextMedia(): void {
    if (this.project?.images) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.project.images.length;
    }
  }

  previousMedia(): void {
    if (this.project?.images) {
      this.selectedImageIndex =
        (this.selectedImageIndex - 1 + this.project.images.length) % this.project.images.length;
    }
  }

  getAllMedia(): MediaItem[] {
    if (!this.project?.images) return [];
    const media = [...this.project.images];
    if (this.project.video) {
      media.push({
        type: 'video',
        url: this.project.video
      });
    }
    return media;
  }

  isVideo(media: MediaItem): boolean {
    return typeof media === 'object' && media.type === 'video';
  }

  getMediaUrl(media: MediaItem): string {
    return typeof media === 'string' ? media : media.url;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'terminado': 'Terminado',
      'en-desarrollo': 'En Desarrollo',
      'pausado': 'Pausado',
      'prototipo': 'Prototipo'
    };
    return labels[status] || status;
  }

  onImageError(imageUrl: string): void {
    this.failedImages.add(imageUrl);
    // Si la imagen actual falla, saltar a la siguiente válida
    if (this.project?.images) {
      for (let i = this.selectedImageIndex; i < this.project.images.length; i++) {
        const url = this.getMediaUrl(this.project.images[i]);
        if (!this.failedImages.has(url) && !this.isVideo(this.project.images[i])) {
          this.selectedImageIndex = i;
          return;
        }
      }
    }
  }

  isImageFailed(media: MediaItem): boolean {
    return this.failedImages.has(this.getMediaUrl(media));
  }

  isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    // Bloquear URLs conocidas como inválidas
    if (url.includes('via.placeholder.com')) {
      return false;
    }
    // Debe empezar con http:// o https://
    return url.startsWith('http://') || url.startsWith('https://');
  }

  canDisplayImage(media: MediaItem): boolean {
    if (this.isVideo(media)) {
      return true;
    }
    const url = this.getMediaUrl(media);
    return this.isValidImageUrl(url) && !this.failedImages.has(url);
  }
}
