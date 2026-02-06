import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsService } from '../../core/services/projects.service';
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

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.projectsService.getAll().subscribe(projects => {
      // Agrupar proyectos por categoría (permitiendo múltiples)
      this.categoryOrder.forEach(category => {
        const categoryProjects = projects.filter(p =>
          Array.isArray(p.category) ? p.category.includes(category as any) : p.category === category
        );
        if (categoryProjects.length > 0) {
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
}
