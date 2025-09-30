# Quick Start: Production-Ready Features

This guide helps you quickly integrate the new production-ready infrastructure.

## 🚀 5-Minute Setup

### 1. Set Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local - ALL variables with "REQUIRED" comment MUST be set
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize in Your App

**Option A: Next.js App Router** (`src/app/layout.tsx`)
```typescript
import { initSentry } from '@/config/sentry';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Initialize Sentry BEFORE your app renders
initSentry();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Option B: Next.js Pages Router** (`src/pages/_app.tsx`)
```typescript
import type { AppProps } from 'next/app';
import { initSentry } from '@/config/sentry';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Initialize Sentry
initSentry();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

### 4. Track Users After Login
```typescript
import { setSentryUser, clearSentryUser } from '@/config/sentry';

// After successful login
function handleLogin(user) {
  setSentryUser({
    id: user.id,
    email: user.email,
    username: user.username
  });
}

// On logout
function handleLogout() {
  clearSentryUser();
}
```

### 5. Use Security Utils

**In Forms:**
```typescript
import { sanitizeHtml, validatePasswordStrength } from '@/lib/security';

function MyForm() {
  const handleSubmit = (data) => {
    // Sanitize HTML
    const cleanContent = sanitizeHtml(data.content);

    // Validate password
    if (data.password) {
      const { valid, errors } = validatePasswordStrength(data.password);
      if (!valid) {
        setError('password', { message: errors.join(', ') });
        return;
      }
    }

    // Continue with clean data
    submitData({ ...data, content: cleanContent });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**In API Routes:**
```typescript
import { sanitizeText, isValidEmail, RateLimiter } from '@/lib/security';

const limiter = new RateLimiter(10, 60000); // 10 req/min

export async function POST(request: Request) {
  // Rate limiting
  if (!limiter.isAllowed()) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const body = await request.json();

  // Validate email
  if (!isValidEmail(body.email)) {
    return new Response('Invalid email', { status: 400 });
  }

  // Sanitize text input
  const cleanName = sanitizeText(body.name);

  // Process request
  // ...
}
```

---

## 🎯 Quick Wins

### Wrap Components with Error Boundaries
```typescript
// For optional features that shouldn't break the page
import { FeatureErrorBoundary } from '@/components/errors/ErrorBoundary';

<FeatureErrorBoundary featureName="Comments">
  <CommentsSection />
</FeatureErrorBoundary>

// For routes
import { RouteErrorBoundary } from '@/components/errors/ErrorBoundary';

<RouteErrorBoundary>
  <YourPageComponent />
</RouteErrorBoundary>
```

### Add Rate Limiting to Forms
```typescript
import { RateLimiter } from '@/lib/security';

const submitLimiter = new RateLimiter(5, 60000); // 5 submissions per minute

function ContactForm() {
  const handleSubmit = async () => {
    if (!submitLimiter.isAllowed()) {
      toast.error('Too many submissions. Please wait a moment.');
      return;
    }

    // Submit form
  };
}
```

### Validate File Uploads
```typescript
import { validateFile } from '@/lib/security';

function ImageUpload() {
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    const { valid, error } = validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });

    if (!valid) {
      setError(error);
      return;
    }

    uploadFile(file);
  };
}
```

---

## 🧪 Testing

### Run Tests
```bash
# Watch mode (development)
npm test

# Run once (CI/CD)
npm run test:run

# With coverage
npm run test:coverage

# Interactive UI
npm run test:ui
```

### Write Your First Test
```typescript
// src/utils/myUtil.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myUtil';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myFunction('')).toBe('');
    expect(myFunction(null)).toBe(undefined);
  });
});
```

---

## 🔍 Monitoring

### View Errors in Development
Errors are logged to console. Check your browser console for detailed error info.

### View Errors in Production
1. Go to Sentry dashboard (https://sentry.io)
2. Select your project
3. View errors, performance, and replays

### Add Custom Error Tracking
```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/config/sentry';

try {
  // Your code
} catch (error) {
  // Manually capture exception with context
  captureException(error, {
    userId: user.id,
    action: 'checkout',
    amount: 100
  });
}

// Log important events (breadcrumbs)
addBreadcrumb('User clicked checkout button', {
  cartTotal: 99.99,
  itemCount: 3
});

// Log informational messages
captureMessage('Payment flow completed', 'info');
```

---

## 🔒 Security Checklist

When handling user input:

- [ ] ✅ Sanitize HTML: `sanitizeHtml(input)`
- [ ] ✅ Validate emails: `isValidEmail(email)`
- [ ] ✅ Validate URLs: `isValidUrl(url)`
- [ ] ✅ Check for SQL injection: `containsSqlInjection(input)`
- [ ] ✅ Check for XSS: `containsXssPattern(input)`
- [ ] ✅ Mask sensitive data in logs: `maskSensitiveData(apiKey)`
- [ ] ✅ Validate passwords: `validatePasswordStrength(password)`
- [ ] ✅ Rate limit forms/APIs: `RateLimiter`
- [ ] ✅ Validate files: `validateFile(file, options)`

---

## 📚 File Reference

All new files are documented with inline comments. Key files:

| File | Purpose |
|------|---------|
| `src/config/env.ts` | Environment validation |
| `src/config/sentry.ts` | Error monitoring setup |
| `src/components/errors/ErrorBoundary.tsx` | React error boundaries |
| `src/lib/security.ts` | Security utilities |
| `vitest.config.ts` | Test configuration |
| `src/test/setup.ts` | Test setup |

---

## 🆘 Troubleshooting

### "Environment validation failed"
Check your `.env.local` file. All REQUIRED variables must be set.

### "Sentry not working"
1. Ensure `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check Sentry is initialized: `initSentry()` called in app entry
3. Verify DSN is correct in Sentry dashboard

### Tests failing
1. Check environment variables in test setup
2. Run `npm install` to ensure test dependencies are installed
3. Check test output for specific errors

### Type errors
The app still has ~6,400 type errors. These will be addressed in future work. They don't prevent the app from running but should be fixed before production.

---

## 🎓 Best Practices

### 1. Always Use Type-Safe Config
```typescript
// ❌ Bad
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ✅ Good
import { env } from '@/config/env';
const url = env.NEXT_PUBLIC_SUPABASE_URL;
```

### 2. Wrap Risky Code with Error Boundaries
```typescript
// ❌ Bad - can crash entire app
<ThirdPartyWidget />

// ✅ Good - isolated failure
<FeatureErrorBoundary featureName="Widget">
  <ThirdPartyWidget />
</FeatureErrorBoundary>
```

### 3. Always Sanitize User Input
```typescript
// ❌ Bad
setContent(userInput);

// ✅ Good
setContent(sanitizeHtml(userInput));
```

### 4. Add Breadcrumbs for Debugging
```typescript
import { addBreadcrumb } from '@/config/sentry';

function handleCheckout() {
  addBreadcrumb('Checkout started', { cartTotal: 99.99 });

  // ... checkout logic

  addBreadcrumb('Payment submitted', { method: 'card' });
}
```

### 5. Test Critical Flows
```typescript
describe('Checkout Flow', () => {
  it('should calculate total correctly', () => {
    const total = calculateTotal(items, tax, fees);
    expect(total).toBeGreaterThan(0);
  });

  it('should handle empty cart', () => {
    const total = calculateTotal([], 0, 0);
    expect(total).toBe(0);
  });
});
```

---

## 📞 Need Help?

1. Check `PRODUCTION_READINESS.md` for detailed documentation
2. Read inline code comments in new files
3. Review example tests in `src/config/env.test.ts` and `src/lib/security.test.ts`
4. Check Sentry dashboard for runtime errors

---

**Last Updated:** $(date)
**Quick Start Guide Version:** 1.0