// Minimal Deno globals to satisfy local TypeScript tooling when editing Supabase Edge functions.
// This is ONLY for editor/linting convenience; Supabase provides real Deno at runtime.

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
};
