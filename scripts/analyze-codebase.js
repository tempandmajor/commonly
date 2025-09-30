#!/usr/bin/env node

/**
 * Commonly App Codebase Analysis Tool
 * 
 * This script helps identify code duplication, architectural conflicts,
 * and inconsistent patterns across the Commonly app codebase.
 * 
 * Usage:
 *   npm run analyze
 *   
 * Requirements:
 *   npm install jscpd dependency-cruiser madge
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const SERVICES_DIR = path.join(SRC_DIR, 'services');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Analyze code duplication using JSCPD
 */
function analyzeDuplication() {
  console.log('📊 Analyzing code duplication...');
  
  try {
    // Run jscpd for code duplication analysis
    execSync(
      `npx jscpd ${SRC_DIR} --ignore "**/*.test.ts,**/*.spec.ts,**/node_modules/**,**/__tests__/**" --output ${path.join(REPORTS_DIR, 'duplication')}`,
      { stdio: 'inherit' }
    );
    
    console.log('✅ Duplication analysis complete. Check the reports/duplication directory.');
  } catch (error) {
    console.error('❌ Error analyzing code duplication:', error.message);
  }
}

/**
 * Generate dependency graph for the codebase
 */
function analyzeDependencies() {
  console.log('🔄 Generating dependency graph...');
  
  try {
    // Generate dependency graph using dependency-cruiser
    execSync(
      `npx depcruise --include-only "^src" --output-type dot ${SRC_DIR} | dot -T svg > ${path.join(REPORTS_DIR, 'dependency-graph.svg')}`,
      { stdio: 'inherit' }
    );
    
    console.log('✅ Dependency analysis complete. Check reports/dependency-graph.svg');
  } catch (error) {
    console.error('❌ Error generating dependency graph:', error.message);
    console.log('💡 Tip: Make sure you have GraphViz installed (brew install graphviz)');
  }
}

/**
 * Analyze circular dependencies
 */
function analyzeCircularDependencies() {
  console.log('🔄 Checking for circular dependencies...');
  
  try {
    // Use madge to detect circular dependencies
    execSync(
      `npx madge --circular --extensions ts,tsx ${SRC_DIR}`,
      { stdio: 'inherit' }
    );
    
    console.log('✅ Circular dependency check complete.');
  } catch (error) {
    console.error('❌ Error checking circular dependencies:', error.message);
  }
}

/**
 * Inventory services and identify potential conflicts
 */
function inventoryServices() {
  console.log('📋 Creating services inventory...');
  
  try {
    if (!fs.existsSync(SERVICES_DIR)) {
      console.log('⚠️ Services directory not found at', SERVICES_DIR);
      return;
    }
    
    const services = fs.readdirSync(SERVICES_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const serviceInventory = {};
    
    services.forEach(service => {
      const servicePath = path.join(SERVICES_DIR, service);
      const serviceStructure = analyzeServiceStructure(servicePath, service);
      serviceInventory[service] = serviceStructure;
    });
    
    // Write inventory to JSON file
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'services-inventory.json'),
      JSON.stringify(serviceInventory, null, 2)
    );
    
    console.log('✅ Services inventory complete. Check reports/services-inventory.json');
    
    // Check for service structure consistency
    analyzeServiceConsistency(serviceInventory);
  } catch (error) {
    console.error('❌ Error creating services inventory:', error.message);
  }
}

/**
 * Analyze the structure of a service directory
 */
function analyzeServiceStructure(servicePath, serviceName) {
  const contents = fs.readdirSync(servicePath, { withFileTypes: true });
  
  // Check for standard directories
  const standardDirs = ['api', 'core', 'utils', 'hooks', 'components', 'edge', 'compatibility', 'tests'];
  const hasDirs = {};
  standardDirs.forEach(dir => {
    hasDirs[dir] = contents.some(item => item.isDirectory() && item.name === dir);
  });
  
  // Check for key files
  const hasReadme = contents.some(item => !item.isDirectory() && item.name === 'README.md');
  const hasIndex = contents.some(item => !item.isDirectory() && (item.name === 'index.ts' || item.name === 'index.tsx'));
  
  // Check for legacy patterns (direct service files)
  const legacyPatterns = contents
    .filter(item => !item.isDirectory() && item.name.endsWith('.ts') && item.name !== 'index.ts')
    .map(item => item.name);
  
  // Check for exports in index.ts if it exists
  let exports = [];
  const indexPath = path.join(servicePath, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    exports = indexContent
      .split('\n')
      .filter(line => line.includes('export'))
      .map(line => line.trim());
  }
  
  return {
    name: serviceName,
    structure: {
      directories: hasDirs,
      hasReadme,
      hasIndex,
    },
    potentialIssues: {
      legacyPatterns,
      missingStandardDirs: standardDirs.filter(dir => !hasDirs[dir]),
      missingReadme: !hasReadme,
      missingIndex: !hasIndex,
    },
    exports,
  };
}

/**
 * Analyze consistency across services
 */
function analyzeServiceConsistency(serviceInventory) {
  console.log('🔍 Analyzing service consistency...');
  
  const serviceNames = Object.keys(serviceInventory);
  const inconsistencies = [];
  
  // Check for missing standard directories
  serviceNames.forEach(service => {
    const missing = serviceInventory[service].potentialIssues.missingStandardDirs;
    if (missing.length > 0) {
      inconsistencies.push(`${service} is missing standard directories: ${missing.join(', ')}`);
    }
  });
  
  // Check for legacy patterns
  serviceNames.forEach(service => {
    const legacy = serviceInventory[service].potentialIssues.legacyPatterns;
    if (legacy.length > 0) {
      inconsistencies.push(`${service} has legacy file patterns: ${legacy.join(', ')}`);
    }
  });
  
  // Check for missing documentation
  serviceNames.forEach(service => {
    if (serviceInventory[service].potentialIssues.missingReadme) {
      inconsistencies.push(`${service} is missing README.md`);
    }
  });
  
  // Write inconsistencies to file
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'service-inconsistencies.txt'),
    inconsistencies.join('\n')
  );
  
  console.log(`✅ Found ${inconsistencies.length} service inconsistencies. Check reports/service-inconsistencies.txt`);
}

/**
 * Find similar function names across services
 */
function findSimilarFunctions() {
  console.log('🔍 Finding similar function names across services...');
  
  try {
    // Use grep to find function declarations
    const grepCommand = `grep -r --include="*.ts" --include="*.tsx" "function\\|const.*=.*=>" ${SRC_DIR} > ${path.join(REPORTS_DIR, 'all-functions.txt')}`;
    execSync(grepCommand, { shell: '/bin/bash' });
    
    console.log('✅ Function analysis complete. Check reports/all-functions.txt');
    
    // This is a simple initial step - in a real implementation, we'd parse this file
    // and analyze function names for similarity using algorithms like Levenshtein distance
  } catch (error) {
    console.error('❌ Error finding similar functions:', error.message);
  }
}

// Main execution
console.log('🚀 Starting Commonly App Codebase Analysis');
console.log('=========================================');

// Run all analysis functions
analyzeDuplication();
analyzeDependencies();
analyzeCircularDependencies();
inventoryServices();
findSimilarFunctions();

console.log('\n✨ Analysis complete. Check the reports directory for results.');
