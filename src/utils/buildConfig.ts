/**
 * Build configuration utility functions
 */

/**
 * Get the current version of the app
 */
import { env as appEnv } from '@/config/environment';
export const getAppVersion = (): string => {
  return appEnv.build.version || '0.0.0';
};

/**
 * Get the build timestamp
 */
export const getBuildTimestamp = (): string => {
  return appEnv.build.timestamp || new Date().toISOString();
};

/**
 * Get commit hash if available
 */
export const getCommitHash = (): string => {
  return appEnv.build.commitHash || 'development';
};

/**
 * Determine if the current build is a production build
 */
export const isProductionBuild = (): boolean => {
  return appEnv.isProduction;
};

/**
 * Get build information for display in the app
 */
export const getBuildInfo = (): {
  version: string;
  timestamp: string;
  commit: string;
  environment: string;
} => {
  return {
    version: getAppVersion(),
    timestamp: getBuildTimestamp(),
    commit: getCommitHash(),
    environment: appEnv.environment,
  };
};

export const backendUrl = process.env.NEXT_PUBLIC_FRONTEND_U as string || appEnv.app.frontendUrl;
