# Admin Portal Security Guide

## Overview

The Commonly admin portal has been enhanced with multiple layers of security to protect against unauthorized access and ensure administrative functions remain secure. This guide outlines all security features, configuration options, and best practices.

## Security Features

### 🔐 Multi-Layer Authentication
- **Basic Authentication**: Email/password login
- **Role-Based Access**: Admin role verification
- **Additional Security Verification**: Time-based security codes for restricted access scenarios

### 🌐 IP Restrictions
- **Configurable IP Whitelisting**: Restrict access to specific IP addresses
- **Private Network Support**: Allow access from local development environments
- **Geographic Restrictions**: Can be configured for specific regions

### ⏰ Time-Based Access Control
- **Business Hours Restrictions**: Limit access to specific hours and days
- **After-Hours Override**: Allow access outside business hours with additional authentication
- **Configurable Schedule**: Customizable time windows and allowed days

### 🛡️ Session Management
- **Session Expiration**: Automatic logout after configured duration
- **Inactivity Timeout**: Session timeout during periods of inactivity
- **Session Validation**: Continuous session integrity checks

### 📊 Activity Logging
- **Comprehensive Logging**: All admin activities are logged with timestamps
- **Security Event Tracking**: Failed login attempts, unauthorized access, security violations
- **Audit Trail**: Complete record of administrative actions for compliance

## Admin Portal Pages

### Core Management
1. **Dashboard** (`/admin`) - Platform overview and analytics
2. **Users** (`/admin/users`) - User account management
3. **Events** (`/admin/events`) - Event management and oversight
4. **Reported Events** (`/admin/reported-events`) - Handle reported content
5. **Settings** (`/admin/settings`) - Platform configuration

### Content & Location Management
6. **Venues** (`/admin/venues`) - Venue listings management
7. **Caterers** (`/admin/caterers`) - Catering service management
8. **Categories** (`/admin/categories`) - Event category management
9. **Locations** (`/admin/locations`) - Geographic location data
10. **Page Content** (`/admin/content`) - Website content management
11. **Careers** (`/admin/careers`) - Job posting management

### Financial & Promotions
12. **Credits** (`/admin/credits`) - User credit management
13. **Platform Credits** (`/admin/platform-credits`) - System credit management
14. **Promotions** (`/admin/promotions`) - Marketing campaign management
15. **Referrals** (`/admin/referrals`) - Referral program oversight

### Analytics & Security
16. **Reports** (`/admin/reports`) - Platform analytics and reporting
17. **Secret Keys** (`/admin/secret-keys`) - API key and secret management

### Commonly Ventures
18. **Management** (`/admin/management`) - Commonly Management division
19. **Records** (`/admin/records`) - Commonly Records label management
20. **Studios** (`/admin/studios`) - Commonly Studios production management

## Security Configuration

### Environment Variables

Add these to your `.env` file for production:

```bash
# Admin Security Configuration
VITE_ADMIN_IP_RESTRICTIONS=true
VITE_ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.50
VITE_ADMIN_TIME_RESTRICTIONS=true
VITE_ADMIN_ALLOW_AFTER_HOURS=false
VITE_ADMIN_SECURITY_LOGGING=true
```

### Configuration Options

The security system is configured in `src/config/adminSecurity.ts`:

#### IP Restrictions
```typescript
ipRestrictions: {
  enabled: true,                    // Enable IP-based access control
  allowedIPs: ['192.168.1.100'],   // Specific allowed IP addresses
  allowPrivateNetworks: false,     // Allow local network access
}
```

#### Time Restrictions
```typescript
timeRestrictions: {
  enabled: true,
  businessHours: {
    enabled: true,
    startHour: 6,                   // 6 AM
    endHour: 23,                    // 11 PM
    allowedDays: [1, 2, 3, 4, 5],   // Monday to Friday
  },
  allowAfterHours: false,           // Require additional auth after hours
}
```

#### Session Management
```typescript
session: {
  maxDuration: 8 * 60 * 60 * 1000,      // 8 hours
  inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours
  requireReauth: true,
}
```

## Security Access Flow

### 1. Initial Authentication
- User navigates to `/admin/login`
- Provides email and password credentials
- System verifies admin role

### 2. Security Verification
- **IP Check**: Validates request origin
- **Time Check**: Confirms access during allowed hours
- **Session Check**: Verifies session validity
- **Browser Security**: Checks for secure connection and features

### 3. Additional Authentication (if required)
- **Time-Based Codes**: Generated every 10 minutes (configurable)
- **Security Code Format**: `ADMIN{hour}{rounded_minute}`
- **Example**: At 14:25, code would be `ADMIN1420`

### 4. Continuous Monitoring
- All activities logged with timestamps
- Session timeout monitoring
- Failed attempt tracking
- Automatic lockout after max attempts

## Time-Based Security Codes

### How They Work
- Generated based on current time
- Change every configurable interval (default: 10 minutes)
- Format: `ADMIN` + current hour + rounded minute interval

### Examples
- **2:15 PM**: `ADMIN1410` (rounded to nearest 10 minutes)
- **2:25 PM**: `ADMIN1420`
- **2:35 PM**: `ADMIN1430`

### When Required
- Access outside business hours
- Access from non-whitelisted IPs
- Session expired scenarios
- Security policy violations

## Activity Logging

### Logged Events
- **ACCESS_ATTEMPT**: User attempts to access admin portal
- **ACCESS_GRANTED**: Successful admin portal access
- **ACCESS_DENIED**: Failed access attempt with reason
- **UNAUTHORIZED_ACCESS**: Non-admin user attempts access
- **SECURITY_CODE_VALID**: Successful additional authentication
- **SECURITY_CODE_INVALID**: Failed additional authentication
- **MAX_ATTEMPTS_EXCEEDED**: Too many failed attempts
- **SESSION_EXPIRED**: Session timeout occurred

### Log Structure
```typescript
{
  timestamp: "2024-01-15T14:30:00.000Z",
  userId: "user_123",
  action: "ACCESS_GRANTED",
  details: "Successfully accessed /admin/users",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  success: true
}
```

## Best Practices

### For Administrators
1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, symbols
2. **Enable 2FA**: Use additional authentication when available
3. **Limit Session Duration**: Don't stay logged in unnecessarily
4. **Monitor Activity Logs**: Regularly review access logs for suspicious activity
5. **Use Secure Networks**: Avoid public WiFi for admin access

### For System Administrators
1. **Configure IP Restrictions**: Limit access to known, secure locations
2. **Set Business Hours**: Restrict access to appropriate time windows
3. **Monitor Failed Attempts**: Set up alerts for repeated failed logins
4. **Regular Security Audits**: Review and update security configurations
5. **Keep Logs Secure**: Ensure activity logs are properly protected

### For Production Deployment
1. **Enable All Security Features**: Turn on IP restrictions, time limits, logging
2. **Use HTTPS Only**: Ensure secure connections for all admin access
3. **Regular Backups**: Backup security configurations and logs
4. **Update Dependencies**: Keep security libraries up to date
5. **Monitor System Health**: Set up alerts for security system failures

## Troubleshooting

### Common Issues

#### "Access Restricted" Message
- **Cause**: Failed security checks
- **Solution**: Check IP whitelist, time restrictions, session validity

#### "Session Expired" Error
- **Cause**: Session timeout or inactivity
- **Solution**: Re-login and adjust session duration if needed

#### "Invalid Security Code" Error
- **Cause**: Incorrect time-based code entry
- **Solution**: Use current time to generate correct code format

#### "Maximum Attempts Exceeded"
- **Cause**: Too many failed authentication attempts
- **Solution**: Wait for lockout period to expire or contact administrator

### Emergency Access
If locked out of admin portal:
1. Check server logs for specific error details
2. Verify environment variable configuration
3. Temporarily disable restrictions in development
4. Contact system administrator for production issues

## Security Monitoring

### Key Metrics to Monitor
- Failed login attempts per hour
- Access attempts from new IP addresses
- After-hours access frequency
- Session duration patterns
- Security code failure rates

### Alerts to Set Up
- Multiple failed attempts from same IP
- Access attempts outside business hours
- New IP addresses accessing admin portal
- Unusual activity patterns
- Security system errors

## Compliance Considerations

### Data Protection
- Activity logs contain user identification data
- Ensure logs are encrypted and access-controlled
- Implement log retention policies
- Regular log archival and deletion

### Audit Requirements
- Maintain complete audit trail of admin activities
- Ensure logs are tamper-evident
- Regular security assessments
- Documentation of security procedures

## Updates and Maintenance

### Regular Tasks
- Review and update IP whitelist
- Adjust time restrictions as needed
- Monitor security log storage
- Update security code intervals
- Test emergency access procedures

### Security Updates
- Keep authentication libraries updated
- Review and update security policies
- Test security features after updates
- Document configuration changes
- Train administrators on new features

---

**Note**: This security system is designed to be highly configurable. Adjust settings based on your organization's security requirements and risk tolerance. Always test security changes in a development environment before deploying to production. 