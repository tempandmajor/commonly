/**
 * Social media links management utility
 * Using the unified cache system
 */

import { CacheType, getCacheProvider, createCache, CacheStorage, CacheProvider } from './cache';

// Default social media links
const defaultSocialLinks = {
  facebook: 'https://www.facebook.com/commonlyapp',
  instagram: 'https://www.instagram.com/commonlyevents',
  linkedin: 'https://www.linkedin.com/company/commonlyevents/',
  threads: 'https://www.threads.com/@commonlyevents',
  youtube: 'https://www.youtube.com/@commonlyapp',
};

// Interface for social links
interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  threads: string;
  youtube: string;
  [key: string]: string;
}

// Get or create the social links cache
const getSocialLinksCache = (): CacheProvider<SocialLinks> => {
  let cache = getCacheProvider<SocialLinks>(CacheType.SOCIAL_LINKS);

  if (!cache) {
    cache = createCache<SocialLinks>(CacheType.SOCIAL_LINKS, CacheStorage.LOCAL_STORAGE);
  }

  return cache;
};

// Get links from cache or use defaults
export const getSocialLinks = (): SocialLinks => {
  try {
    const cache = getSocialLinksCache();
    const storedLinks = cache.get('links');
    return storedLinks || defaultSocialLinks;
  } catch (error) {
    return defaultSocialLinks;
  }
};

// Save links to cache
export const saveSocialLinks = (links: Record<string, string>): void => {
  try {
    const cache = getSocialLinksCache();
    cache.set('links', links as SocialLinks);
  } catch (_error) {
    // Error handling silently ignored
  }
};

// Clear social links cache
export const clearSocialLinksCache = async (): Promise<boolean> => {
  try {
    const cache = getSocialLinksCache();
    await cache.clear();
    return true;
  } catch (error) {
    return false;
  }
};
