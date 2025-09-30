# Production Security Configuration Guide

## Admin Portal Security Setup

This guide provides the recommended security configuration for deploying the Commonly admin portal in production.

### Environment Variables

Create a `.env.production` file with the following configuration:

```bash
# Production Environment Configuration for Commonly App

# Supabase Configuration
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Admin Portal Security Configuration
# Enable IP restrictions for admin portal (REQUIRED)
VITE_ADMIN_IP_RESTRICTIONS=true

# Comma-separated list of allowed IP addresses for admin access
# Add your office/home IP addresses here
VITE_ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.50,203.0.113.0

# Disable private network access in production (RECOMMENDED)
VITE_ADMIN_ALLOW_PRIVATE_NETWORKS=false

# Enable time-based access restrictions (RECOMMENDED)
VITE_ADMIN_TIME_RESTRICTIONS=true

# Disable after-hours access without additional auth (RECOMMENDED)
VITE_ADMIN_ALLOW_AFTER_HOURS=false

# Enable additional authentication (REQUIRED)
VITE_ADMIN_ADDITIONAL_AUTH=true

# Custom admin portal path for security through obscurity (OPTIONAL)
VITE_ADMIN_CUSTOM_PATH=/secure-management-portal-xyz123

# Enable comprehensive security logging (REQUIRED)
VITE_ADMIN_SECURITY_LOGGING=true

# Application Configuration
VITE_APP_URL=https://commonly.app
VITE_APP_ENV=production
```

### Security Features Enabled by Default

#### 🚫 Search Engine Blocking
- **robots.txt**: Admin routes are blocked from all search engines
- **Meta tags**: `noindex, nofollow, noarchive, nosnippet, noimageindex`
- **X-Robots-Tag**: HTTP headers prevent indexing

#### 🔒 Access Control
- **IP Whitelisting**: Only specified IP addresses can access admin portal
- **Time Restrictions**: Access limited to business hours (6 AM - 11 PM, Mon-Fri)
- **Session Management**: 4-hour max session, 30-minute inactivity timeout
- **Additional Authentication**: Time-based security codes required

#### 🛡️ Security Headers
- **X-Frame-Options**: `DENY` - Prevents embedding in frames
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **Referrer-Policy**: `no-referrer` - No referrer information sent
- **Permissions-Policy**: Restricts browser features

#### 📊 Activity Monitoring
- **Comprehensive Logging**: All admin activities logged with timestamps
- **Failed Attempt Tracking**: Automatic lockout after 3 failed attempts
- **IP Address Logging**: All access attempts include IP address
- **User Agent Tracking**: Browser and device information logged

#### 🔐 Browser Security
- **Developer Tools Detection**: Alerts when dev tools are opened
- **Console Clearing**: Regular console clearing in production
- **Right-click Disabled**: Context menu disabled in production
- **Keyboard Shortcuts Disabled**: F12, Ctrl+Shift+I, etc. disabled

### Deployment Checklist

#### ✅ Pre-Deployment
- [ ] Configure IP whitelist with trusted addresses only
- [ ] Set custom admin portal path (optional but recommended)
- [ ] Enable all security features in environment variables
- [ ] Test admin access from allowed IP addresses
- [ ] Verify time restrictions work as expected

#### ✅ Post-Deployment
- [ ] Confirm admin portal is not accessible from unauthorized IPs
- [ ] Verify robots.txt is blocking admin routes
- [ ] Test that admin portal doesn't appear in search results
- [ ] Monitor admin activity logs for any suspicious activity
- [ ] Set up alerts for failed login attempts

### Security Best Practices

#### 🏢 Network Security
1. **Use VPN**: Connect through company VPN for admin access
2. **Static IPs**: Use static IP addresses for the whitelist
3. **Regular Updates**: Update IP whitelist when team members change locations
4. **Monitor Access**: Regularly review admin access logs

#### 👤 User Security
1. **Strong Passwords**: Require complex passwords for admin accounts
2. **2FA Ready**: System supports additional authentication methods
3. **Limited Sessions**: Keep admin sessions short and logout when done
4. **Secure Devices**: Only access admin portal from secure, trusted devices

#### 🔍 Monitoring
1. **Activity Logs**: Review admin activity logs weekly
2. **Failed Attempts**: Set up alerts for multiple failed login attempts
3. **Unusual Access**: Monitor for access from new IP addresses
4. **Time Anomalies**: Watch for unusual access times

### Emergency Access

If you're locked out of the admin portal:

1. **Check IP Address**: Ensure you're accessing from a whitelisted IP
2. **Time Restrictions**: Verify you're within business hours
3. **Environment Variables**: Check that security settings are correct
4. **Server Logs**: Review server logs for specific error messages

### Customization Options

#### Custom Admin Path
```bash
# Instead of /admin, use a custom path
VITE_ADMIN_CUSTOM_PATH=/management-dashboard-secure-2024
```

#### Relaxed Development Settings
```bash
# For staging/development environments
VITE_ADMIN_IP_RESTRICTIONS=false
VITE_ADMIN_TIME_RESTRICTIONS=false
VITE_ADMIN_ADDITIONAL_AUTH=false
```

#### Enhanced Security
```bash
# For maximum security
VITE_ADMIN_IP_RESTRICTIONS=true
VITE_ADMIN_ALLOWED_IPS=single.trusted.ip.only
VITE_ADMIN_TIME_RESTRICTIONS=true
VITE_ADMIN_ALLOW_AFTER_HOURS=false
VITE_ADMIN_ALLOW_PRIVATE_NETWORKS=false
```

### Security Incident Response

If unauthorized access is detected:

1. **Immediate Actions**:
   - Change all admin passwords
   - Update IP whitelist to remove compromised addresses
   - Review and rotate API keys
   - Check admin activity logs for unauthorized actions

2. **Investigation**:
   - Review server access logs
   - Check for any data modifications
   - Verify system integrity
   - Document the incident

3. **Prevention**:
   - Strengthen IP restrictions
   - Reduce session timeouts
   - Enable additional security measures
   - Update security procedures

### Support and Maintenance

#### Regular Tasks
- **Weekly**: Review admin activity logs
- **Monthly**: Update IP whitelist as needed
- **Quarterly**: Security configuration review
- **Annually**: Complete security audit

#### Updates
- Keep security configurations up to date
- Monitor for new security features
- Test security measures after updates
- Document any configuration changes

---

**⚠️ IMPORTANT**: Never disable security features in production without proper authorization and documentation. All admin portal access should be monitored and logged. 