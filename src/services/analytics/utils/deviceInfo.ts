/**
 * Analytics Service - Device Information Utility
 *
 * This file provides utilities for collecting device and browser information
 * for analytics tracking purposes.
 */

/**
 * Device information interface
 */
export interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  screenSize: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Get detailed information about the current device and browser
 */
export const getDeviceInfo = (): DeviceInfo => {
  // Default values for server-side rendering
  const defaultInfo: DeviceInfo = {
    deviceType: 'unknown',
    browser: 'unknown',
    os: 'unknown',
    screenSize: 'unknown',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  };

  // Return default values if not in a browser environment
  if (typeof window === 'undefined' || !window.navigator) {
    return defaultInfo;
  }

  const ua = navigator.userAgent;

  // Detect browser
  let browser = 'unknown';
  if (ua.indexOf('Chrome') !== -1) {
    browser = 'Chrome';
  } else if (ua.indexOf('Safari') !== -1) {
    browser = 'Safari';
  } else if (ua.indexOf('Firefox') !== -1) {
    browser = 'Firefox';
  } else if (ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident/') !== -1) {
    browser = 'Internet Explorer';
  } else if (ua.indexOf('Edge') !== -1) {
    browser = 'Edge';
  }

  // Detect OS
  let os = 'unknown';
  if (ua.indexOf('Windows') !== -1) {
    os = 'Windows';
  } else if (ua.indexOf('Mac OS') !== -1) {
    os = 'macOS';
  } else if (ua.indexOf('Linux') !== -1) {
    os = 'Linux';
  } else if (ua.indexOf('Android') !== -1) {
    os = 'Android';
  } else if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) {
    os = 'iOS';
  }

  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet =
    /iPad|tablet|Tablet/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const isDesktop = !isMobile && !isTablet;

  let deviceType = 'desktop';
  if (isMobile) deviceType = 'mobile';
  if (isTablet) deviceType = 'tablet';

  // Get screen size
  const screenSize = `${window.screen.width}x${window.screen.height}`;

  return {
    deviceType,
    browser,
    os,
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
  };
};

/**
 * Get basic device type (desktop, tablet, mobile)
 */
export const getDeviceType = (): string => {
  return getDeviceInfo().deviceType;
};

/**
 * Check if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  return getDeviceInfo().isMobile;
};

/**
 * Check if the current device is tablet
 */
export const isTabletDevice = (): boolean => {
  return getDeviceInfo().isTablet;
};

/**
 * Check if the current device is desktop
 */
export const isDesktopDevice = (): boolean => {
  return getDeviceInfo().isDesktop;
};
