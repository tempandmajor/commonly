/**
 * URL utility functions for API client service
 */

/**
 * Adds query parameters to a URL
 *
 * @param url - Base URL
 * @param params - Query parameters to add
 * @returns URL with query parameters
 */
export function addQueryParams(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;

  const urlObj = new URL(url.startsWith('http') ? url : `http://domain.com${url}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlObj.searchParams.set(key, String(value));
    }
  });

  return url.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
}

/**
 * Joins URL segments, handling trailing and leading slashes
 *
 * @param segments - URL segments to join
 * @returns Joined URL
 */
export function joinUrl(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .join('/');
}

/**
 * Checks if a URL is absolute (starts with http:// or https://)
 *
 * @param url - URL to check
 * @returns Whether the URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
