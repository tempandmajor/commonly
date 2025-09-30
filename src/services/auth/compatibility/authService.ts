/**
 * Authentication Service - Compatibility Layer
 *
 * This file provides backward compatibility with existing code that uses
 * the legacy auth service functions. It maps legacy function calls to the
 * new consolidated API.
 *
 * @deprecated Use the consolidated authAPI instead
 */

import { authAPI } from '../api/authAPI';
import type {
  User,
  UserProfile,
  EmailCredentials,
  RegistrationData,
  PasswordResetData,
} from '../core/types';

/**
 * @deprecated Use authAPI instead
 */
export class AuthService {
  /**
   * @deprecated Use authAPI.signInWithEmail instead
   */
  static async login(email: string, password: string): Promise<User | null> {
    return authAPI.signInWithEmail({ email, password });
  }

  /**
   * @deprecated Use authAPI.signUp instead
   */
  static async register(data: RegistrationData): Promise<User | null> {
    return authAPI.signUp(data);
  }

  /**
   * @deprecated Use authAPI.signOut instead
   */
  static async logout(): Promise<void> {
    return authAPI.signOut();
  }

  /**
   * @deprecated Use authAPI.getCurrentUser instead
   */
  static async getCurrentUser(): Promise<User | null> {
    return authAPI.getCurrentUser();
  }

  /**
   * @deprecated Use authAPI.getSession instead
   */
  static async getSession() {
    return authAPI.getSession();
  }

  /**
   * @deprecated Use authAPI.updateProfile instead
   */
  static async updateProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    return authAPI.updateProfile(userId, data);
  }

  /**
   * @deprecated Use authAPI.updateEmail instead
   */
  static async updateEmail(email: string): Promise<void> {
    return authAPI.updateEmail(email);
  }

  /**
   * @deprecated Use authAPI.updatePassword instead
   */
  static async updatePassword(password: string): Promise<void> {
    return authAPI.updatePassword(password);
  }

  /**
   * @deprecated Use authAPI.resetPassword instead
   */
  static async resetPassword(data: PasswordResetData): Promise<void> {
    return authAPI.resetPassword(data);
  }
}

/**
 * @deprecated Use authAPI instead
 */
export class SocialAuthService {
  /**
   * @deprecated Use authAPI.signInWithProvider instead
   */
  static async loginWithGoogle(): Promise<void> {
    return authAPI.signInWithProvider('google');
  }

  /**
   * @deprecated Use authAPI.signInWithProvider instead
   */
  static async loginWithFacebook(): Promise<void> {
    return authAPI.signInWithProvider('facebook');
  }

  /**
   * @deprecated Use authAPI.signInWithProvider instead
   */
  static async loginWithApple(): Promise<void> {
    return authAPI.signInWithProvider('apple');
  }

  /**
   * @deprecated Use authAPI.signInWithProvider instead
   */
  static async loginWithProvider(provider: string): Promise<void> {
    return authAPI.signInWithProvider(provider);
  }
}

/**
 * @deprecated Legacy auth service export
 */
export default AuthService;
