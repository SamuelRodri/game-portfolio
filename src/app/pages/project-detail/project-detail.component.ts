import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProjectsService } from '../../core/services/projects.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="project; else notFound">
      <h1>{{ project.title }}</h1>
      <p>{{ project.description }}</p>
      <p><strong>Engine:</strong> {{ project.engine }}</p>
      <p><strong>Lenguaje:</strong> {{ project.language }}</p>
    </section>

    <ng-template #notFound>
      <p>Proyecto no encontrado</p>
    </ng-template>
  `
})
export class ProjectDetailComponent implements OnInit {

  project?: Project;

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectsService.getById(id).subscribe(p => {
        this.project = p;
      });
    }
  }
}
