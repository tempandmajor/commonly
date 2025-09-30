# 🔒 Supabase Security Setup Guide

## **Security Issues to Fix**

### **Issue 1: Function Search Path Mutable** ✅ **FIXED**
- **Problem**: `update_daily_analytics` function has mutable search path
- **Solution**: Applied in migration `20250127000000_security_fixes.sql`

### **Issue 2: Leaked Password Protection Disabled** ⚠️ **NEEDS MANUAL SETUP**
- **Problem**: Supabase Auth doesn't check against HaveIBeenPwned.org
- **Solution**: Manual configuration required in Supabase Dashboard

---

## ✅ **STEP-BY-STEP FIXES**

### **Step 1: Apply Database Security Migration**

Run the security migration to fix the function search path issue:

```bash
# Apply the security fixes migration
supabase db push
```

This migration includes:
- ✅ Fixed `update_daily_analytics` function with proper `search_path`
- ✅ Created secure analytics functions with `SECURITY DEFINER`
- ✅ Added proper RLS policies for analytics data
- ✅ Created performance indexes
- ✅ Added comprehensive analytics functions

### **Step 2: Enable Leaked Password Protection**

#### **In Supabase Dashboard:**

1. **Navigate to Authentication Settings**
   - Go to your Supabase project dashboard
   - Click on **Authentication** in the left sidebar
   - Click on **Settings**

2. **Enable Leaked Password Protection**
   - Scroll down to **Security** section
   - Find **"Leaked password protection"**
   - Toggle the switch to **ON**
   - This will enable checking against HaveIBeenPwned.org

3. **Configure Additional Security Settings**
   - **Password strength requirements**: Set minimum length to 8 characters
   - **Enable email confirmations**: Toggle ON
   - **Enable phone confirmations**: Toggle ON (if using phone auth)
   - **Enable reCAPTCHA**: Toggle ON for additional protection

4. **Save Changes**
   - Click **Save** to apply the security settings

### **Step 3: Verify Security Configuration**

#### **Test the Security Fixes:**

1. **Test Function Security**
```sql
-- Test that the function now has proper search path
SELECT 
    proname as function_name,
    prosrc as function_source,
    proconfig as function_config
FROM pg_proc 
WHERE proname = 'update_daily_analytics';
```

2. **Test Leaked Password Protection**
```javascript
// Test with a known compromised password
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123' // This should be rejected
});

// Should return an error about compromised password
console.log('Signup result:', { data, error });
```

### **Step 4: Additional Security Recommendations**

#### **Enable Additional Security Features:**

1. **Multi-Factor Authentication (MFA)**
   - Go to **Authentication** → **Settings**
   - Enable **Multi-factor authentication**
   - Configure TOTP (Time-based One-Time Password)

2. **Session Management**
   - Set **Session timeout** to a reasonable value (e.g., 24 hours)
   - Enable **Refresh token rotation**

3. **Rate Limiting**
   - Configure rate limits for authentication endpoints
   - Set reasonable limits for sign-up, sign-in, and password reset

4. **Audit Logging**
   - Enable **Audit logs** in Supabase
   - Monitor authentication events

---

## 🔍 **VERIFICATION CHECKLIST**

### **After Applying Fixes:**

- [ ] **Function Search Path**: `update_daily_analytics` has `SET search_path = public`
- [ ] **Leaked Password Protection**: Enabled in Supabase Auth settings
- [ ] **RLS Policies**: Analytics data properly secured
- [ ] **Performance Indexes**: Created for analytics queries
- [ ] **Security Functions**: All analytics functions use `SECURITY DEFINER`

### **Test Cases:**

- [ ] **Compromised Password**: Try signing up with `password123` (should be rejected)
- [ ] **Function Execution**: Test analytics functions work correctly
- [ ] **Data Access**: Verify users can only access their own data
- [ ] **Performance**: Analytics queries should be fast with new indexes

---

## 🚨 **SECURITY MONITORING**

### **Regular Security Checks:**

1. **Weekly Security Audit**
   - Check Supabase security advisor
   - Review authentication logs
   - Monitor for suspicious activity

2. **Monthly Security Review**
   - Update security policies
   - Review RLS policies
   - Check for new security features

3. **Quarterly Security Assessment**
   - Full security audit
   - Penetration testing
   - Update security documentation

---

## 📞 **TROUBLESHOOTING**

### **Common Issues:**

#### **Leaked Password Protection Not Working**
- **Cause**: Feature not enabled in Supabase dashboard
- **Solution**: Enable in Authentication → Settings → Security

#### **Function Still Shows Search Path Warning**
- **Cause**: Migration not applied correctly
- **Solution**: Re-run the security migration

#### **Analytics Functions Not Working**
- **Cause**: Missing permissions or RLS policies
- **Solution**: Check function permissions and RLS policies

---

## ✅ **EXPECTED RESULTS**

After implementing these fixes:

- ✅ **Function Search Path**: Fixed and secure
- ✅ **Leaked Password Protection**: Enabled and working
- ✅ **Analytics Security**: Properly secured with RLS
- ✅ **Performance**: Optimized with indexes
- ✅ **Compliance**: Meets security best practices

---

## 🔗 **USEFUL LINKS**

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth/security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
- [Supabase Auth Settings](https://supabase.com/docs/guides/auth/auth-settings) 