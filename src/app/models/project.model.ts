export type MediaItem = string | { type: 'video' | 'image'; url: string };

export interface Project {
  id: string;
  title: string;
  engine: string;
  language: string;
  year: number;
  category: ('proyecto' | 'gamejam' | 'vr')[];
  status: 'terminado' | 'en-desarrollo' | 'pausado' | 'prototipo';
  shortDescription: string;
  longDescription: string;
  tags: string[];
  images: MediaItem[];
  video: string | null;
  links: {
    github: string | null;
    itch: string | null;
    demo: string | null;
  };
  order?: number;
}
