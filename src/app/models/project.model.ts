export interface Project {
  id: string;
  title: string;
  engine: string;
  language: string;
  year: number;
  category: ('proyecto' | 'gamejam' | 'vr')[];
  description: string;
  tags: string[];
  images: string[];
  video?: string;
  links: {
    github?: string;
    itch?: string;
    demo?: string;
  };
}
