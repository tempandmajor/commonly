# 🔧 Stripe Connect Debugging Guide

## **Quick Fix Summary**

I've implemented comprehensive fixes for your Stripe Connect 401 Unauthorized issues:

### **✅ What Was Fixed**

1. **Frontend Authentication** - Enhanced token handling in edge function calls
2. **Real Stripe Status Checking** - Updated hook to verify actual Stripe account status
3. **Debug Tools** - Created browser and manual testing tools
4. **Error Handling** - Improved error messages and user feedback

---

## **🚀 How to Test the Fixes**

### **Option 1: Browser Debug Tool**
1. Navigate to `/stripe-connect-test` (or add `<StripeConnectDebug />` to any page)
2. Click "Debug Stripe Connect" button in bottom-left corner
3. Review all status checks and follow recommendations
4. Use "Test Onboarding" button if needed

### **Option 2: Manual Testing Script**
1. Install dependencies: `npm install node-fetch`
2. Get your JWT token:
   - Open browser dev tools (F12)
   - Go to Application > Local Storage
   - Find key starting with `sb-` and ending with `-auth-token`
   - Copy the `access_token` value
3. Update `test-stripe-connect.js` with your token
4. Run: `node test-stripe-connect.js`

---

## **🔍 Root Cause Analysis**

### **Primary Issues Found:**
1. **Missing Auth Headers** - Edge function calls weren't consistently including JWT tokens
2. **Stale Status Checks** - Hook only checked database, not real Stripe status
3. **Poor Error Handling** - 401 errors weren't providing actionable feedback
4. **Session Expiry** - No detection of expired authentication sessions

### **The Fix:**
- ✅ **Enhanced `callEdgeFunction`** - Always includes fresh JWT token
- ✅ **Updated `useStripeConnect`** - Checks real Stripe account status via API
- ✅ **Better Error Handling** - Clear messages for authentication failures
- ✅ **Debug Tools** - Easy way to diagnose issues in real-time

---

## **📋 Testing Checklist**

### **Before Testing:**
- [ ] User is logged in
- [ ] Environment variables are set (`STRIPE_SECRET_KEY`, `FRONTEND_URL`)
- [ ] Network connection is stable

### **Test Scenarios:**
1. **✅ Authentication Test**
   - [ ] Can call `getConnectAccountStatus()` without 401 error
   - [ ] JWT token is automatically included in requests
   
2. **✅ Account Status Test**
   - [ ] Hook correctly identifies if account exists
   - [ ] Real Stripe status is checked (not just database)
   - [ ] `chargesEnabled` and `payoutsEnabled` are accurate
   
3. **✅ Onboarding Test**
   - [ ] Can create onboarding link without errors
   - [ ] Link redirects to Stripe Connect onboarding
   - [ ] Returns to correct URL after completion

### **Expected Results:**
- ✅ No more 401 Unauthorized errors
- ✅ Accurate Stripe account status
- ✅ Working onboarding flow
- ✅ Real-time status updates

---

## **🛠️ Troubleshooting**

### **Still Getting 401 Errors?**
1. **Check Session Validity**
   ```javascript
   // In browser console:
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```

2. **Verify Environment Variables**
   - Check Supabase secrets: Use debug tool or `supabase secrets list`
   - Ensure `STRIPE_SECRET_KEY` is set
   - Verify `FRONTEND_URL` matches your domain

3. **Clear Browser Storage**
   - Clear localStorage and sessionStorage
   - Log out and back in
   - Try incognito/private browsing

### **Edge Function Not Working?**
1. **Check Supabase Logs**
   ```bash
   supabase functions logs connect-account
   ```

2. **Test Direct API Call**
   ```bash
   curl -X GET "https://your-project.supabase.co/functions/v1/connect-account" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -H "apikey: YOUR_ANON_KEY"
   ```

### **Account Status Issues?**
1. **Verify Stripe Connect Setup**
   - Check Stripe Dashboard > Connect > Accounts
   - Ensure account has completed onboarding
   - Verify identity verification is complete

2. **Database Sync Issues**
   - Check `users` table for `stripe_account_id`
   - Verify account ID matches Stripe Dashboard
   - Use debug tool to compare database vs API status

---

## **🔒 Security Notes**

- JWT tokens expire - the fix handles automatic refresh
- Never log JWT tokens in production
- Stripe secrets are only accessible server-side
- Debug tools should be removed in production builds

---

## **📞 Support**

If you're still experiencing issues:

1. **Use the Debug Tool** - It will identify most common problems
2. **Check Browser Console** - Look for detailed error messages
3. **Review Supabase Logs** - Check edge function execution logs
4. **Test Manual Script** - Isolate authentication vs. application issues

The fixes should resolve the 401 Unauthorized errors and provide much better visibility into what's happening with your Stripe Connect integration! 