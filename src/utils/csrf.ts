/**
 * CSRF Protection Utility
 * Provides Cross-Site Request Forgery protection for the application
 */

interface CSRFConfig {
  tokenName: string;
  headerName: string;
  cookieName: string;
  tokenLength: number;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  httpOnly: boolean;
}

class CSRFProtection {
  private config: CSRFConfig;
  private token: string | null = null;

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      tokenName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      cookieName: 'csrf_token',
      tokenLength: 32,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false, // Set to false for client-side access
          ...config,
    };

    this.initializeToken();
  }

  /**
   * Generate a cryptographically secure random token
   */
  private generateToken(): string {
    const array = new Uint8Array(this.config.tokenLength);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Initialize or retrieve existing CSRF token
   */
  private initializeToken(): void {
    // Try to get existing token from localStorage
    const existingToken = localStorage.getItem(this.config.tokenName);

    if (existingToken && this.isValidToken(existingToken)) {
      this.token = existingToken;
    } else {
      this.token = this.generateToken();
      localStorage.setItem(this.config.tokenName, this.token);
    }

    // Set token in a meta tag for server-side access
    this.setMetaTag();
  }

  /**
   * Validate token format
   */
  private isValidToken(token: string): boolean {
    return (
      typeof token === 'string' &&
      token.length === this.config.tokenLength * 2 &&
      /^[a-f0-9]+$/i.test(token)
    );
  }

  /**
   * Set CSRF token in meta tag
   */
  private setMetaTag(): void {
    if (!this.token) return;

    let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = this.token;
  }

  /**
   * Get the current CSRF token
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Refresh the CSRF token
   */
  public refreshToken(): string {
    this.token = this.generateToken();
    localStorage.setItem(this.config.tokenName, this.token);
    this.setMetaTag();
    return this.token;
  }

  /**
   * Get headers object with CSRF token
   */
  public getHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('CSRF token not initialized');
    }

    return {
      [this.config.headerName]: this.token,
    };
  }

  /**
   * Add CSRF token to form data
   */
  public addToFormData(formData: FormData): FormData {
    if (!this.token) {
      throw new Error('CSRF token not initialized');
    }

    formData.append(this.config.tokenName, this.token);
    return formData;
  }

  /**
   * Add CSRF token to URL search params
   */
  public addToURLParams(params: URLSearchParams): URLSearchParams {
    if (!this.token) {
      throw new Error('CSRF token not initialized');
    }

    params.append(this.config.tokenName, this.token);
    return params;
  }

  /**
   * Create a protected fetch function
   */
  public createProtectedFetch(): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);

      // Add CSRF token to headers for state-changing methods
      const method = init?.method?.toUpperCase() || 'GET';
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (!this.token) {
          throw new Error('CSRF token not initialized');
        }
        headers.set(this.config.headerName, this.token);
      }

      const modifiedInit: RequestInit = {
          ...init,
        headers,
      };

      try {
        const response = await fetch(input, modifiedInit);

        // Check if server returned a new CSRF token
        const newToken = response.headers.get('X-CSRF-Token-Refresh');
        if (newToken && this.isValidToken(newToken)) {
          this.token = newToken;
          localStorage.setItem(this.config.tokenName, newToken);
          this.setMetaTag();
        }

        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  /**
   * Validate CSRF token from server response
   */
  public validateToken(tokenToValidate: string): boolean {
    return this.token === tokenToValidate && this.isValidToken(tokenToValidate);
  }

  /**
   * Clear CSRF token (for logout)
   */
  public clearToken(): void {
    this.token = null;
    localStorage.removeItem(this.config.tokenName);

    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLElement;
    if (metaTag) {
      metaTag.remove();
    }
  }

  /**
   * Get CSRF configuration
   */
  public getConfig(): CSRFConfig {
    return { ...this.config };
  }
}

// Create global CSRF protection instance
export const csrfProtection = new CSRFProtection();

// Export protected fetch function
export const protectedFetch = csrfProtection.createProtectedFetch();

// Utility functions
export const getCSRFToken = () => csrfProtection.getToken();
export const getCSRFHeaders = () => csrfProtection.getHeaders();
export const refreshCSRFToken = () => csrfProtection.refreshToken();
export const clearCSRFToken = () => csrfProtection.clearToken();

// React hook for CSRF protection
export const useCSRFProtection = () => {
  return {
    token: csrfProtection.getToken(),
    headers: csrfProtection.getHeaders(),
    refreshToken: () => csrfProtection.refreshToken(),
    clearToken: () => csrfProtection.clearToken(),
    protectedFetch: csrfProtection.createProtectedFetch(),
    addToFormData: (formData: FormData) => csrfProtection.addToFormData(formData),
    addToURLParams: (params: URLSearchParams) => csrfProtection.addToURLParams(params),
  };
};

// Initialize CSRF protection
if (typeof window !== 'undefined') {
  // Auto-refresh token every hour
  setInterval(
    () => {
      csrfProtection.refreshToken();
    },
    60 * 60 * 1000
  );

  // Refresh token on page focus (in case user was away for a long time)
  window.addEventListener('focus', () => {
    const token = csrfProtection.getToken();
    if (!token) {
      csrfProtection.refreshToken();
    }
  });

  // Clear token on page unload if configured
  window.addEventListener('beforeunload', () => {
    // Intentionally no-op for now. We do not clear CSRF token automatically on unload.
    // Customize here if you want different behavior per environment.
  });
}
