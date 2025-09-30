/**
 * Meta Tag Validator Utility
 * Helps validate and test Open Graph and Twitter Card meta tags
 */

interface MetaTagData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName?: string | undefined;
  twitterHandle?: string | undefined;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export class MetaTagValidator {
  private static readonly TITLE_MAX_LENGTH = 70;
  private static readonly DESCRIPTION_MAX_LENGTH = 160;
  private static readonly OG_TITLE_MAX_LENGTH = 95;
  private static readonly OG_DESCRIPTION_MAX_LENGTH = 300;
  private static readonly TWITTER_TITLE_MAX_LENGTH = 70;
  private static readonly TWITTER_DESCRIPTION_MAX_LENGTH = 200;

  /**
   * Validates meta tag data for social media sharing
   */
  static validate(data: MetaTagData): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Title validation
    if (!data.title) {
      errors.push('Title is required');
    } else {
      if (data.title.length > this.TITLE_MAX_LENGTH) {
        warnings.push(
          `Title is ${data.title.length} characters, recommended max is ${this.TITLE_MAX_LENGTH}`
        );
      }
      if (data.title.length > this.OG_TITLE_MAX_LENGTH) {
        warnings.push(
          `Title may be truncated on Facebook (${data.title.length}/${this.OG_TITLE_MAX_LENGTH} chars)`
        );
      }
      if (data.title.length < 30) {
        suggestions.push('Consider making the title more descriptive (30+ characters)');
      }
    }

    // Description validation
    if (!data.description) {
      warnings.push('Description is recommended for better social sharing');
    } else {
      if (data.description.length > this.DESCRIPTION_MAX_LENGTH) {
        warnings.push(
          `Description is ${data.description.length} characters, recommended max is ${this.DESCRIPTION_MAX_LENGTH}`
        );
      }
      if (data.description.length > this.OG_DESCRIPTION_MAX_LENGTH) {
        warnings.push(
          `Description may be truncated on Facebook (${data.description.length}/${this.OG_DESCRIPTION_MAX_LENGTH} chars)`
        );
      }
      if (data.description.length > this.TWITTER_DESCRIPTION_MAX_LENGTH) {
        warnings.push(
          `Description may be truncated on Twitter (${data.description.length}/${this.TWITTER_DESCRIPTION_MAX_LENGTH} chars)`
        );
      }
      if (data.description.length < 50) {
        suggestions.push('Consider adding more detail to the description (50+ characters)');
      }
    }

    // Image validation
    if (!data.image) {
      warnings.push('Image is recommended for better social sharing engagement');
    } else {
      if (!this.isValidImageUrl(data.image)) {
        errors.push('Image URL appears to be invalid');
      }
      if (!data.image.startsWith('https://')) {
        warnings.push('Image should use HTTPS for better compatibility');
      }
    }

    // URL validation
    if (!data.url) {
      errors.push('URL is required');
    } else {
      if (!this.isValidUrl(data.url)) {
        errors.push('URL appears to be invalid');
      }
    }

    // Type validation
    const validTypes = ['website', 'article', 'product', 'profile', 'event'];
    if (!validTypes.includes(data.type)) {
      warnings.push(`Type "${data.type}" may not be recognized by all platforms`);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      warnings,
      errors,
      suggestions,
    };
  }

  /**
   * Generates meta tag HTML for testing
   */
  static generateMetaTagsHTML(data: MetaTagData): string {
    const metaTags = [
      `<title>${this.escapeHtml(data.title)}</title>`,
      `<meta name="description" content="${this.escapeHtml(data.description)}" />`,
      `<link rel="canonical" href="${this.escapeHtml(data.url)}" />`,
      '',
      '<!-- Open Graph / Facebook -->',
      `<meta property="og:type" content="${this.escapeHtml(data.type)}" />`,
      `<meta property="og:url" content="${this.escapeHtml(data.url)}" />`,
      `<meta property="og:title" content="${this.escapeHtml(data.title)}" />`,
      `<meta property="og:description" content="${this.escapeHtml(data.description)}" />`,
      `<meta property="og:image" content="${this.escapeHtml(data.image)}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      data.siteName
        ? `<meta property="og:site_name" content="${this.escapeHtml(data.siteName)}" />`
        : '',
      '',
      '<!-- Twitter Card -->',
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:url" content="${this.escapeHtml(data.url)}" />`,
      `<meta name="twitter:title" content="${this.escapeHtml(data.title)}" />`,
      `<meta name="twitter:description" content="${this.escapeHtml(data.description)}" />`,
      `<meta name="twitter:image" content="${this.escapeHtml(data.image)}" />`,
      data.twitterHandle
        ? `<meta name="twitter:site" content="${this.escapeHtml(data.twitterHandle)}" />`
        : '',
    ].filter(Boolean);

    return metaTags.join('\n');
  }

  /**
   * Gets current page meta tags for debugging
   */
  static getCurrentPageMetaTags(): Record<string, string> {
    const metaTags: Record<string, string> = {};

    // Get title
    metaTags.title = document.title;

    // Get meta tags
    const metaElements = document.querySelectorAll('meta') as NodeListOf<HTMLElement>;
    metaElements.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metaTags[name] = content;
      }
    });

    // Get canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLElement;
    if (canonical) {
      metaTags.canonical = canonical.getAttribute('href') || '';
    }

    return metaTags;
  }

  /**
   * Tests social media sharing URLs
   */
  static getSocialMediaTestUrls(url: string): Record<string, string> {
    const encodedUrl = encodeURIComponent(url);

    return {
      facebook: `https://developers.facebook.com/tools/debug/?q=${encodedUrl}`,
      twitter: `https://cards-dev.twitter.com/validator?url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/post-inspector/inspect/${encodedUrl}`,
      pinterest: `https://developers.pinterest.com/tools/url-/?link=${encodedUrl}`,
      whatsapp: `https://developers.facebook.com/tools/debug/?q=${encodedUrl}`, // WhatsApp uses Facebook's Open Graph
    };
  }

  /**
   * Generates preview data for social platforms
   */
  static generateSocialPreviews(data: MetaTagData) {
    return {
      facebook: {
        title: data.title.substring(0, this.OG_TITLE_MAX_LENGTH),
        description: data.description.substring(0, this.OG_DESCRIPTION_MAX_LENGTH),
        image: data.image,
        url: data.url,
        siteName: data.siteName || 'Commonly',
      },
      twitter: {
        title: data.title.substring(0, this.TWITTER_TITLE_MAX_LENGTH),
        description: data.description.substring(0, this.TWITTER_DESCRIPTION_MAX_LENGTH),
        image: data.image,
        url: data.url,
        site: data.twitterHandle || '@commonlyapp',
      },
      linkedin: {
        title: data.title.substring(0, this.OG_TITLE_MAX_LENGTH),
        description: data.description.substring(0, this.OG_DESCRIPTION_MAX_LENGTH),
        image: data.image,
        url: data.url,
      },
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidImageUrl(url: string): boolean {
    if (!this.isValidUrl(url)) return false;

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const urlLower = url.toLowerCase();

    return (
      imageExtensions.some(ext => urlLower.includes(ext)) ||
      urlLower.includes('image') ||
      urlLower.includes('photo') ||
      urlLower.includes('picture')
    );
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * React hook for validating meta tags
 */
export const useMetaTagValidation = (data: MetaTagData) => {
  const validation = MetaTagValidator.validate(data);
  const socialPreviews = MetaTagValidator.generateSocialPreviews(data);
  const testUrls = MetaTagValidator.getSocialMediaTestUrls(data.url);

  return {
    validation,
    socialPreviews,
    testUrls,
    metaTagsHTML: MetaTagValidator.generateMetaTagsHTML(data),
  };
};
