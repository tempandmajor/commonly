export enum ContentType {
  BLOG = 'blog',
  PAGE = 'page',
  POST = 'post',
  ANNOUNCEMENT = 'announcement',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface ContentItem {
  id?: string | undefined;
  title: string;
  slug: string;
  type: ContentType;
  status: ContentStatus;
  content: string;
  excerpt?: string | undefined;
  featuredImage?: string | undefined;
  author?: string | undefined;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}
