/**
 * API Client Service - Compatibility Layer
 *
 * This file provides backward compatibility with legacy API service functions
 * by mapping them to the new consolidated API client.
 *
 * @deprecated Use the consolidated API client instead
 */

import { appClient, externalClient } from '../client/clients';
import { addQueryParams, handleApiError, createFormData } from '../utils/apiUtils';

/**
 * @deprecated Use appClient instead
 */
export class ApiService {
  /**
   * @deprecated Use appClient.get instead
   */
  static async get<T = any>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const urlWithParams = params ? addQueryParams(url, params) : url;
      const response = await appClient.get<T>(urlWithParams);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * @deprecated Use appClient.post instead
   */
  static async post<T = any>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await appClient.post<T>(url, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * @deprecated Use appClient.put instead
   */
  static async put<T = any>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await appClient.put<T>(url, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * @deprecated Use appClient.delete instead
   */
  static async delete<T = any>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await appClient.delete<T>(url, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * @deprecated Use createFormData utility instead
   */
  static createFormData(data: Record<string, unknown>): FormData {
    return createFormData(data);
  }

  /**
   * @deprecated Use appClient.post with FormData instead
   */
  static async postFormData<T = any>(url: string, data: Record<string, unknown>): Promise<T> {
    try {
      const formData = createFormData(data);

      const response = await appClient.post<T>(url, formData, {
        headers: {
          // Don't set Content-Type, browser will set it with proper boundary for FormData
          'Content-Type': undefined,
        },
      });

      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}

/**
 * @deprecated Use externalClient instead
 */
export class ExternalApiService {
  /**
   * @deprecated Use externalClient.get instead
   */
  static async fetch<T = any>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const urlWithParams = params ? addQueryParams(url, params) : url;
      const response = await externalClient.get<T>(urlWithParams);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }

  /**
   * @deprecated Use externalClient.post instead
   */
  static async post<T = any>(url: string, data?: unknown): Promise<T> {
    try {
      const response = await externalClient.post<T>(url, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
}

/**
 * @deprecated Use appClient instead
 */
export default ApiService;
