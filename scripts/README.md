# Database Schema Audit Tools

This directory contains comprehensive audit tools to prevent database schema and code conflicts like the profile image persistence issue we just fixed.

## 🔍 Available Audit Scripts

### 1. Basic Database Audit (`audit-database-schema.js`)
**Purpose**: Scans your codebase for database references and conflicting import patterns.

**Usage**:
```bash
node scripts/audit-database-schema.js
```

**What it checks**:
- ✅ Conflicting Supabase import paths
- ✅ Deprecated import patterns
- ✅ Database table references in code
- ✅ Column references in select/update statements
- ✅ Usage of problematic patterns (like `select('*')`)

### 2. Advanced Supabase Schema Audit (`audit-supabase-schema.ts`)
**Purpose**: Connects to your actual Supabase database and compares schema with code references.

**Prerequisites**:
```bash
npm install tsx @supabase/supabase-js
```

**Usage**:
```bash
# Make sure your environment variables are set
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Run the audit
npx tsx scripts/audit-supabase-schema.ts
```

**What it checks**:
- ✅ All features of the basic audit
- ✅ **Missing tables** referenced in code but not in database
- ✅ **Missing columns** referenced in code but not in database
- ✅ **Unused tables** in database but not referenced in code
- ✅ **Schema mismatches** between code expectations and actual database
- ✅ **Real-time validation** against your live Supabase instance

## 🎯 Why These Tools Matter

The profile image persistence issue we just fixed was caused by:
1. **Schema Mismatch**: Code tried to save `cover_image_url` to `users` table, but it belongs in `user_profiles`
2. **Conflicting Import Paths**: Multiple different Supabase import paths causing confusion
3. **Missing Validation**: No automated way to catch these mismatches

These audit tools prevent such issues by:
- 🔍 **Early Detection**: Catch schema issues before they cause runtime errors
- 🔧 **Automated Fixes**: Generate specific commands to fix common issues
- 📊 **Comprehensive Reports**: See exactly what tables/columns your code uses
- ⚡ **CI/CD Integration**: Run in your pipeline to prevent regressions

## 🚨 Common Issues These Tools Catch

### 1. Missing Tables
```
❌ Table 'user_preferences' referenced in code but not found in database
💡 Create table 'user_preferences' or fix table name in: components/settings/UserPreferences.tsx
```

### 2. Missing Columns
```
❌ Column 'cover_image_url' in table 'users' referenced in code but not found in database
💡 Add column 'cover_image_url' to table 'users' or fix column name
```

### 3. Conflicting Imports
```
⚠️ Found 3 different Supabase import paths:
  - @/lib/supabase (used in 15 files)
  - @/integrations/supabase/client (used in 45 files)
  - @/services/supabase/database (used in 8 files)
```

### 4. Deprecated Patterns
```
⚠️ Using select(*) which can cause TypeScript deep instantiation errors
💡 Specify exact columns to avoid compilation issues
```

## 🔧 Auto-Fix Commands

The audit tools generate specific commands to fix issues:

```bash
# Fix deprecated import patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|@/lib/supabase|@/integrations/supabase/client|g'

# Add missing columns (generated based on your specific issues)
ALTER TABLE users ADD COLUMN cover_image_url TEXT;
ALTER TABLE user_profiles ADD COLUMN bio TEXT;
```

## 📋 Integration with Development Workflow

### Add to package.json
```json
{
  "scripts": {
    "audit:db": "node scripts/audit-database-schema.js",
    "audit:db:full": "npx tsx scripts/audit-supabase-schema.ts",
    "audit:db:ci": "npx tsx scripts/audit-supabase-schema.ts && echo 'Schema audit passed'"
  }
}
```

### Pre-commit Hook
```bash
#!/bin/sh
# Run basic audit before each commit
npm run audit:db
if [ $? -ne 0 ]; then
  echo "❌ Database audit failed. Please fix issues before committing."
  exit 1
fi
```

### CI/CD Pipeline
```yaml
# Add to your GitHub Actions workflow
- name: Database Schema Audit
  run: |
    npm run audit:db:full
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 🎯 Best Practices

1. **Run audits regularly**: At least weekly or before major releases
2. **Fix errors immediately**: Don't let schema mismatches accumulate
3. **Standardize imports**: Use one consistent Supabase import path
4. **Document schema changes**: Update code when you modify database schema
5. **Use in CI/CD**: Prevent schema issues from reaching production

## 🔄 Continuous Monitoring

Set up these scripts to run automatically:
- **Daily**: Basic audit to catch new issues
- **Before deployment**: Full audit with database connection
- **After schema changes**: Immediate validation
- **In development**: Real-time feedback for developers

## 💡 Tips for Maximum Effectiveness

1. **Environment Variables**: Ensure your `.env` file has correct Supabase credentials
2. **Database Permissions**: Make sure your Supabase key can read schema information
3. **Regular Updates**: Keep audit scripts updated as your codebase grows
4. **Team Training**: Make sure all developers know how to run and interpret audits
5. **Documentation**: Keep this README updated with new patterns and fixes

---

**Remember**: These tools are designed to prevent issues like the profile image persistence problem we just solved. Regular use will save hours of debugging time and prevent user-facing bugs. 