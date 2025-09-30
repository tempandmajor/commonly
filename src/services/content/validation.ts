import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { handleError } from '@/utils/errorUtils';

interface ContentValidationOptions {
  maxTitleLength?: number | undefined;
  maxDescriptionLength?: number | undefined;
  requiredFields?: string[] | undefined;
  allowHtml?: boolean | undefined;
  allowedTypes?: string[] | undefined;
}

type ValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validates content object against a set of rules
 *
 * @param content - The content to validate
 * @param options - Validation options
 * @returns Validation result with valid flag and any error messages
 */
export const validateContent = (
  content: unknown,
  options: ContentValidationOptions = {}
): ValidationResult => {
  const {
    maxTitleLength = 100,
    maxDescriptionLength = 5000,
    requiredFields = ['title', 'type'],
    allowHtml = false,
    allowedTypes = ['article', 'page', 'promotion', 'faq', 'announcement'],
  } = options;

  const errors: string[] = [];

  try {
    // Check required fields
    for (const field of requiredFields) {
      if (!content[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check content type
    if (content.type && !allowedTypes.includes(content.type)) {
      errors.push(
        `Invalid content type: ${content.type}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Validate title length
    if (content.title && content.title.length > maxTitleLength) {
      errors.push(`Title exceeds maximum length of ${maxTitleLength} characters`);
    }

    // Validate description length
    if (content.description && content.description.length > maxDescriptionLength) {
      errors.push(`Description exceeds maximum length of ${maxDescriptionLength} characters`);
    }

    // Check for suspicious content or scripts if HTML is not allowed
    if (!allowHtml && content.body && typeof content.body === 'string') {
      if (
        /<script\b[^>]*>|<\/script>|javascript:|onclick=|onerror=|eval\(|setTimeout\(|setInterval\(|new Function\(/i.test(
          content.body
        )
      ) {
        errors.push('Content contains potentially malicious code');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    handleError(error, { content }, 'Error validating content');
    return {
      valid: false,
      errors: ['Internal validation error occurred'],
    };
  }
};

/**
 * Sanitizes HTML content to remove potentially malicious code
 *
 * @param content - The HTML content to sanitize
 * @param options - Optional configuration for sanitization
 * @returns Sanitized content string
 */
export const sanitizeContent = (
  content: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  } = {}
): string => {
  try {
    if (!content) return '';

    // DOMPurify configuration
    const config: DOMPurify.Config = {
      ALLOWED_TAGS: options.allowedTags || [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'b',
        'i',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'hr',
        'div',
        'span',
      ],
      ALLOWED_ATTR: options.allowedAttributes || ['href', 'src', 'alt', 'title', 'class', 'style'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOW_DATA_ATTR: false,
    };

    // Use DOMPurify to sanitize HTML content
    return DOMPurify.sanitize(content, config);
  } catch (error) {
    handleError(error, { ...(content && { contentLength: content.length }) }, 'Error sanitizing content');
    // Return empty string if sanitization fails to prevent unsafe content
    return '';
  }
};

export const validateUniqueSlug = async (
  slug: string,
  type: string,
  excludeId?: string
): Promise<boolean> => {
  try {
    let query = supabase.from('ContentTest').select('id').eq('title', slug); // Using title as slug since ContentTest doesn't have slug column

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    return false;
  }
};

