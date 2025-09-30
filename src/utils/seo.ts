export interface SeoOptions {
  title?: string | undefined;
  description?: string | undefined;
}

export function setSeo({ title, description }: SeoOptions): void {
  if (typeof document === 'undefined') return;
  if (title) {
    document.title = title;
  }
  if (description) {
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }
}
