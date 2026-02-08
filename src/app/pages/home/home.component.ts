import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsDataService } from '../../core/services/projects-data.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  categories: Map<string, Project[]> = new Map();
  categoryOrder = ['proyecto', 'vr', 'gamejam'];
  categoryLabels: { [key: string]: string } = {
    'proyecto': 'Proyectos',
    'vr': 'Realidad Virtual',
    'gamejam': 'Game Jam'
  };
  failedImages = new Set<string>();

  constructor(private projectsService: ProjectsDataService) {}

  ngOnInit(): void {
    this.projectsService.getAll().subscribe(projects => {
      // Agrupar proyectos por categoría (permitiendo múltiples)
      this.categoryOrder.forEach(category => {
        const categoryProjects = projects.filter(p =>
          Array.isArray(p.category) ? p.category.includes(category as any) : p.category === category
        );
        // Ordenar por propiedad 'order', luego por año descendente
        if (categoryProjects.length > 0) {
          categoryProjects.sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return b.year - a.year;
          });
          this.categories.set(category, categoryProjects);
        }
      });
    });
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabels[category] || category;
  }

  getVisibleCategories(): string[] {
    return this.categoryOrder.filter(cat => this.categories.has(cat));
  }

  getProjectsByCategory(category: string): Project[] {
    return this.categories.get(category) || [];
  }

  getProjectGroups(category: string): Project[][] {
    const projects = this.getProjectsByCategory(category);
    const groups: Project[][] = [];
    for (let i = 0; i < projects.length; i += 3) {
      groups.push(projects.slice(i, i + 3));
    }
    return groups;
  }

  onImageError(imageUrl: string): void {
    this.failedImages.add(imageUrl);
  }

  getFirstValidImage(project: Project): string | null {
    if (!project.images || project.images.length === 0) {
      return null;
    }
    const firstImage = project.images[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;
    return (this.failedImages.has(imageUrl) || !this.isValidImageUrl(imageUrl)) ? null : imageUrl;
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
}
