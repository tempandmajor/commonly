// Safe toast utility that works in both browser and Node test environments
// It lazy-loads `sonner` only when running in a browser.

export const safeToast = {
  error: (message: string) => {
    if (typeof window === 'undefined') return;
    // Lazy import to avoid ESM import issues during SSR/tests
    import('sonner')
      .then(mod => {
        try {
          mod.toast.error(message);
        } catch {
          // no-op if sonner fails
        }
      })
      .catch(() => {
        // no-op if import fails
      });
  },
  success: (message: string) => {
    if (typeof window === 'undefined') return;
    import('sonner')
      .then(mod => {
        try {
          mod.toast.success(message);
        } catch {}
      })
      .catch(() => {});
  },
  info: (message: string) => {
    if (typeof window === 'undefined') return;
    import('sonner')
      .then(mod => {
        try {
          mod.toast.info?.(message) ?? mod.toast(message);
        } catch {}
      })
      .catch(() => {});
  },
  warning: (message: string) => {
    if (typeof window === 'undefined') return;
    import('sonner')
      .then(mod => {
        try {
          // Sonner does not have a dedicated warning; use error style alternative or default
          (mod.toast as any).warning?.(message) ?? mod.toast(message);
        } catch {}
      })
      .catch(() => {});
  },
};
