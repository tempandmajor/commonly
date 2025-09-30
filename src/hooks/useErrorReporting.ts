/**
 * Mock error reporting hook
 */

export const useErrorReporting = () => {
  const reportError = (error: Error, context?: Record<string, unknown>) => {};

  return { reportError };
};
