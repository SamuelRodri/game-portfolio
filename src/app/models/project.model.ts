export interface Project {
  id: string;
  title: string;
  engine: string;
  language: string;
  year: number;
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
