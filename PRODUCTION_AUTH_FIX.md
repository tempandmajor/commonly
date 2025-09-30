# 🔐 Production Authentication Fix Guide

## **🚨 CRITICAL ISSUE IDENTIFIED**

Your Supabase Authentication is configured for development domains but your production app is deployed to a different domain, causing login failures.

---

## **🔍 Root Cause Analysis**

### **Current Configuration**:
- **Development Domain**: `commonlyapp.com`
- **Production Domain**: `commonlyapp.com` (your actual domain)
- **Deployment URL**: `commonlyapp.lovable.app` (Lovable.dev deployment)
- **Supabase Project**: `bmhsrfvrpxmwydzepzyi`
- **Issue**: Supabase Auth blocks requests from unauthorized domains

---

## **✅ SOLUTION STEPS**

### **Step 1: Update Supabase Authentication Settings**

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/bmhsrfvrpxmwydzepzyi
   - Go to **Authentication** → **URL Configuration**

2. **Update Site URL**
   - Set **Site URL** to: `https://commonlyapp.com`

3. **Update Redirect URLs**
   - Add these URLs to **Redirect URLs**:
   ```
   https://commonlyapp.com
   https://commonlyapp.com/**
   https://commonlyapp.com/auth/confirm
   https://commonlyapp.com/auth/callback
   https://commonlyapp.com/auth/reset-password
   https://commonlyapp.lovable.app
   https://commonlyapp.lovable.app/**
   https://commonlyapp.lovable.app/auth/confirm
   https://commonlyapp.lovable.app/auth/callback
   https://commonlyapp.lovable.app/auth/reset-password
   ```

4. **Save Changes**
   - Click **Save** to apply the configuration

---

### **Step 2: Update Environment Variables**

Update your production environment variables in Lovable.dev:

```bash
# Required Variables
VITE_SUPABASE_URL=https://bmhsrfvrpxmwydzepzyi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtaHNyZnZycHhtd3lkemVwenlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MTksImV4cCI6MjA2NTQ5OTkxOX0.7Z5wb7x_4ZruN1pIcqIz3D9Sv8CK29JVC824rDQKias

# Production URLs
VITE_APP_URL=https://commonlyapp.com
VITE_BASE_URL=https://commonlyapp.com

# Optional but recommended
VITE_SUPABASE_PROJECT_ID=bmhsrfvrpxmwydzepzyi
```

---

### **Step 3: Update AuthProvider Configuration**

The `AuthProvider.tsx` needs to be updated to handle production domains properly:

```typescript
// In src/providers/AuthProvider.tsx
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
      // Add this for production
      data: {
        app_metadata: {
          source: 'production'
        }
      }
    }
  });
  // ... rest of the function
};
```

---

### **Step 4: Add Authentication Debug Component**

Create a debug component to help troubleshoot auth issues:

```typescript
// src/components/debug/AuthDebug.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDebug = async () => {
    const info = {
      currentDomain: window.location.origin,
      expectedDomain: import.meta.env.VITE_APP_URL,
      environment: import.meta.env.MODE,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      timestamp: new Date().toISOString()
    };

    // Test auth connection
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      info.authTest = {
        success: !error,
        hasSession: !!session,
        error: error?.message
      };
    } catch (err) {
      info.authTest = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }

    setDebugInfo(info);
  };

  if (!debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={runDebug} variant="outline" size="sm">
          🔐 Debug Auth
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🔐 Auth Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <strong>Domain:</strong> {debugInfo.currentDomain}
          </div>
          <div>
            <strong>Expected:</strong> {debugInfo.expectedDomain}
          </div>
          <div>
            <strong>Environment:</strong> 
            <Badge variant={debugInfo.environment === 'production' ? 'default' : 'secondary'}>
              {debugInfo.environment}
            </Badge>
          </div>
          <div>
            <strong>Auth Test:</strong>
            <Badge variant={debugInfo.authTest?.success ? 'default' : 'destructive'}>
              {debugInfo.authTest?.success ? 'PASS' : 'FAIL'}
            </Badge>
          </div>
          {debugInfo.authTest?.error && (
            <div className="text-red-500">
              <strong>Error:</strong> {debugInfo.authTest.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

### **Step 5: Test Authentication Flow**

1. **Clear Browser Storage**
   ```javascript
   // Run in browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Test Sign Up Flow**
   - Try creating a new account
   - Check if email confirmation works
   - Verify redirect after confirmation

3. **Test Sign In Flow**
   - Try signing in with existing account
   - Check if session persists
   - Test sign out functionality

---

### **Step 6: Monitor Authentication Logs**

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs → Auth
   - Look for failed authentication attempts
   - Check for domain-related errors

2. **Check Browser Console**
   - Look for CORS errors
   - Check for authentication errors
   - Monitor network requests

---

## **🚨 COMMON ISSUES & SOLUTIONS**

### **Issue 1: CORS Errors**
**Solution**: Ensure your production domain is in Supabase Auth settings

### **Issue 2: "Invalid redirect URL"**
**Solution**: Add your production domain to Redirect URLs in Supabase

### **Issue 3: Session not persisting**
**Solution**: Check if cookies are being set properly and domain matches

### **Issue 4: Email confirmation not working**
**Solution**: Verify email redirect URL is correct in AuthProvider

---

## **✅ VERIFICATION CHECKLIST**

- [ ] Supabase Site URL updated to production domain (`commonlyapp.com`)
- [ ] Redirect URLs include both `commonlyapp.com` and `commonlyapp.lovable.app`
- [ ] Environment variables updated in Lovable.dev
- [ ] AuthProvider uses `window.location.origin`
- [ ] Browser storage cleared
- [ ] Authentication flow tested
- [ ] No CORS errors in console
- [ ] Session persists after page reload

---

## **📞 SUPPORT**

If issues persist:
1. Check Supabase Auth logs for specific errors
2. Verify all environment variables are set correctly
3. Test with a fresh browser session
4. Check if the issue is domain-specific or global

**Most Common Fix**: Update Supabase Authentication URL Configuration to include your production domain (`commonlyapp.com`) and deployment URL (`commonlyapp.lovable.app`). 