// Environment configuration for external services
export const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string || (import.meta as any)?.env?.VITE_SUPABASE_URL || '',
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string ||
      (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
      '',
    serviceRoleKey: '',
  },

  // Stripe Configuration
  stripe: {
    publishableKey:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string ||
      (import.meta as any)?.env?.VITE_STRIPE_PUBLISHABLE_KEY ||
      '',
    secretKey: '',
    webhookSecret: '',
  },

  // OpenAI Configuration
  openai: {
    apiKey:
      process.env.NEXT_PUBLIC_OPENAI_API_KEY as string || (import.meta as any)?.env?.OPENAI_API_KEY || '',
  },

  // App Configuration
  app: {
    url:
      process.env.NEXT_PUBLIC_APP_URL as string ||
      (import.meta as any)?.env?.VITE_APP_URL ||
      'http://localhost:3000',
  },

  // Google Configuration
  google: {
    apiKey:
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string ||
      (import.meta as any)?.env?.VITE_GOOGLE_API_KEY ||
      '',
  },

  // LiveKit Configuration (replaces Agora)
  livekit: {
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL as string || (import.meta as any)?.env?.VITE_LIVEKIT_URL || '',
    apiKey:
      process.env.NEXT_PUBLIC_LIVEKIT_API_KEY as string ||
      (import.meta as any)?.env?.VITE_LIVEKIT_API_KEY ||
      '',
    apiSecret:
      process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET as string ||
      (import.meta as any)?.env?.VITE_LIVEKIT_API_SECRET ||
      '',
  },
};

// Validation function to check if required environment variables are set
export const validateConfig = () => {
  const missing: string[] = [];
  const optional: string[] = [];

  if (!config.supabase.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!config.stripe.publishableKey) missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  if (!config.app.url) missing.push('NEXT_PUBLIC_APP_URL');

  // Optional services (warnings)
  if (!config.google.apiKey) optional.push('NEXT_PUBLIC_GOOGLE_API_KEY');
  if (!config.openai?.apiKey) optional.push('NEXT_PUBLIC_OPENAI_API_KEY');
  if (!config.livekit.url) optional.push('NEXT_PUBLIC_LIVEKIT_URL');
  if (!config.livekit.apiKey) optional.push('NEXT_PUBLIC_LIVEKIT_API_KEY');
  if (!config.livekit.apiSecret) optional.push('NEXT_PUBLIC_LIVEKIT_API_SECRET');

  if (missing.length > 0) {
    return false;
  }

  return true;
};

export default config;
