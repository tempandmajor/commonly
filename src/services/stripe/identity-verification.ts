/**
 * Stripe Identity Verification Service
 */

export interface IdentityVerificationSession {
  id: string;
  status: 'requires_input' | 'processing' | 'verified' | 'failed';
  url?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface CreateIdentityVerificationOptions {
  metadata?: Record<string, any> | undefined;
  return_url?: string | undefined;
}

export class IdentityVerificationService {
  static async createVerificationSession(
    options: CreateIdentityVerificationOptions = {}
  ): Promise<IdentityVerificationSession> {
    // Mock implementation for now
    console.log('Creating identity verification session:', options);

    return {
      id: 'vs_mock_' + Date.now(),
      status: 'requires_input',
      url: `https://verify.stripe.com/mock-session`,
      metadata: options.metadata || {},
    };
  }

  static async retrieveVerificationSession(
    sessionId: string
  ): Promise<IdentityVerificationSession> {
    console.log('Retrieving verification session:', sessionId);

    return {
      id: sessionId,
      status: 'verified',
      metadata: {},
    };
  }

  static async listVerificationSessions(userId?: string): Promise<IdentityVerificationSession[]> {
    console.log('Listing verification sessions for user:', userId);

    return [];
  }
}

// Additional convenience functions
export const createIdentityVerificationSession = (
  options: CreateIdentityVerificationOptions = {}
) => IdentityVerificationService.createVerificationSession(options);

export const checkIdentityVerificationStatus = (sessionId: string) =>
  IdentityVerificationService.retrieveVerificationSession(sessionId);

export default IdentityVerificationService;
