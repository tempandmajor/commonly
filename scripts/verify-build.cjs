/**
 * Pre-build verification script
 * Checks if the project is ready for production build
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'src/main.tsx',
  'src/App.tsx',
  'index.html'
];

const CRITICAL_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PROJECT_ID'
];

const RECOMMENDED_ENV_VARS = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_APP_URL',
  'VITE_BASE_URL'
];

const FORBIDDEN_ENV_VARS = [
  'VITE_STRIPE_SECRET_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY'
];

function checkRequiredFiles() {
  console.log('📁 Checking required files...');
  const missing = [];
  
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required files:');
    missing.forEach(file => console.error(`  - ${file}`));
    return false;
  }
  
  console.log('✅ All required files present');
  return true;
}

function checkEnvironmentVariables() {
  console.log('🔧 Checking environment variables...');
  const missing = [];
  const warnings = [];
  const security_issues = [];
  
  // Check critical variables
  for (const envVar of CRITICAL_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }
  
  // Check for forbidden variables (security issues)
  for (const envVar of FORBIDDEN_ENV_VARS) {
    if (process.env[envVar]) {
      security_issues.push(envVar);
    }
  }
  
  // Report results
  if (security_issues.length > 0) {
    console.error('🚨 SECURITY ISSUES - These secrets should NOT be in frontend environment:');
    security_issues.forEach(envVar => console.error(`  - ${envVar}`));
  }
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing critical environment variables:');
    missing.forEach(envVar => console.warn(`  - ${envVar}`));
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Missing recommended environment variables:');
    warnings.forEach(envVar => console.warn(`  - ${envVar}`));
  }
  
  if (missing.length === 0 && warnings.length === 0 && security_issues.length === 0) {
    console.log('✅ Environment variables configured correctly');
  }
  
  // Don't fail build for missing env vars, but fail for security issues
  return security_issues.length === 0;
}

function checkPackageJson() {
  console.log('📦 Checking package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts?.build) {
      console.error('❌ No build script found in package.json');
      return false;
    }
    
    if (!packageJson.dependencies?.react) {
      console.error('❌ React dependency not found');
      return false;
    }
    
    console.log('✅ Package.json looks good');
    return true;
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    return false;
  }
}

function checkDeploymentReadiness() {
  console.log('🚀 Checking deployment readiness...');
  
  const isProduction = process.env.NODE_ENV === 'production';
  const issues = [];
  
  if (isProduction) {
    // Check for test Stripe keys in production
    if (process.env.VITE_STRIPE_PUBLISHABLE_KEY && 
        process.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
      issues.push('Using Stripe test keys in production');
    }
    
    // Check for localhost URLs
    const urlVars = ['VITE_APP_URL', 'VITE_BASE_URL', 'VITE_API_URL'];
    for (const urlVar of urlVars) {
      if (process.env[urlVar] && process.env[urlVar].includes('localhost')) {
        issues.push(`${urlVar} contains localhost URL in production`);
      }
    }
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Deployment readiness issues:');
    issues.forEach(issue => console.warn(`  - ${issue}`));
  } else {
    console.log('✅ Ready for deployment');
  }
  
  return issues.length === 0;
}

function main() {
  console.log('🚀 Running pre-build verification...\n');
  
  const checks = [
    checkRequiredFiles(),
    checkPackageJson(),
    checkEnvironmentVariables(),
    checkDeploymentReadiness()
  ];
  
  const allPassed = checks.every(check => check);
  
  console.log('\n📊 Verification Summary:');
  if (allPassed) {
    console.log('✅ All checks passed! Build should succeed.');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkRequiredFiles,
  checkEnvironmentVariables,
  checkPackageJson,
  checkDeploymentReadiness
};
