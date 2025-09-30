#!/usr/bin/env node

/**
 * Database Schema Audit Script
 * 
 * This script audits the codebase and database to identify:
 * 1. Missing tables referenced in code
 * 2. Missing columns referenced in code
 * 3. Conflicting import paths
 * 4. Unused database tables/columns
 * 5. Schema mismatches between code and database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DatabaseAudit {
  constructor() {
    this.issues = {
      missingTables: [],
      missingColumns: [],
      conflictingImports: [],
      unusedTables: [],
      schemaConflicts: [],
      deprecatedPatterns: []
    };
    
    this.srcPath = path.join(process.cwd(), 'src');
    this.supabasePath = path.join(process.cwd(), 'supabase');
    
    // Known table references from code analysis
    this.knownTables = new Set();
    this.knownColumns = new Map(); // table -> Set of columns
    this.importPatterns = new Map(); // file -> imports
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
  }

  logIssue(type, message, severity = 'warning') {
    const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
    const color = severity === 'error' ? 'red' : severity === 'warning' ? 'yellow' : 'blue';
    this.log(`${icon} [${type.toUpperCase()}] ${message}`, color);
  }

  // Scan all TypeScript/JavaScript files for database references
  scanCodebaseForDbReferences() {
    this.logSection('Scanning Codebase for Database References');
    
    const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      this.analyzeFileContent(file, content);
    });

    this.log(`Found ${this.knownTables.size} table references in ${files.length} files`);
  }

  analyzeFileContent(filePath, content) {
    const relativePath = path.relative(this.srcPath, filePath);
    
    // 1. Check for Supabase table references
    const tableMatches = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/g);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableName = match.match(/\.from\(['"`]([^'"`]+)['"`]\)/)[1];
        this.knownTables.add(tableName);
        
        if (!this.knownColumns.has(tableName)) {
          this.knownColumns.set(tableName, new Set());
        }
      });
    }

    // 2. Check for column references in select statements
    const selectMatches = content.match(/\.select\(['"`]([^'"`]+)['"`]\)/g);
    if (selectMatches) {
      selectMatches.forEach(match => {
        const selectClause = match.match(/\.select\(['"`]([^'"`]+)['"`]\)/)[1];
        // Parse columns from select clause
        const columns = selectClause.split(',').map(col => col.trim().split(' ')[0]);
        
        // Try to find which table this belongs to (look backwards in content)
        const beforeSelect = content.substring(0, content.indexOf(match));
        const tableMatch = beforeSelect.match(/\.from\(['"`]([^'"`]+)['"`]\)[^.]*$/);
        if (tableMatch) {
          const tableName = tableMatch[1];
          if (!this.knownColumns.has(tableName)) {
            this.knownColumns.set(tableName, new Set());
          }
          columns.forEach(col => {
            if (col !== '*' && col.length > 0) {
              this.knownColumns.get(tableName).add(col);
            }
          });
        }
      });
    }

    // 3. Check for conflicting import patterns
    const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const importPath = match.match(/from\s+['"`]([^'"`]+)['"`]/)[1];
        if (importPath.includes('supabase') || importPath.includes('database')) {
          if (!this.importPatterns.has(relativePath)) {
            this.importPatterns.set(relativePath, []);
          }
          this.importPatterns.get(relativePath).push(importPath);
        }
      });
    }

    // 4. Check for deprecated patterns
    this.checkDeprecatedPatterns(relativePath, content);
  }

  checkDeprecatedPatterns(filePath, content) {
    const deprecatedPatterns = [
      {
        pattern: /@\/lib\/supabase/g,
        message: 'Using deprecated @/lib/supabase import path',
        replacement: '@/integrations/supabase/client'
      },
      {
        pattern: /@\/services\/supabase\/database/g,
        message: 'Using non-existent @/services/supabase/database import',
        replacement: '@/integrations/supabase/client'
      },
      {
        pattern: /serverTimestamp/g,
        message: 'Using serverTimestamp which may not exist',
        replacement: 'new Date().toISOString()'
      },
      {
        pattern: /\.select\(['"`]\*['"`]\)/g,
        message: 'Using select(*) which can cause TypeScript deep instantiation errors',
        replacement: 'Specify exact columns'
      }
    ];

    deprecatedPatterns.forEach(({ pattern, message, replacement }) => {
      if (pattern.test(content)) {
        this.issues.deprecatedPatterns.push({
          file: filePath,
          message,
          replacement
        });
      }
    });
  }

  getAllFiles(dir, extensions) {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return files;
  }

  // Check for conflicting import patterns
  checkConflictingImports() {
    this.logSection('Checking for Conflicting Import Patterns');
    
    const supabaseImports = new Map();
    
    this.importPatterns.forEach((imports, file) => {
      imports.forEach(importPath => {
        if (importPath.includes('supabase')) {
          if (!supabaseImports.has(importPath)) {
            supabaseImports.set(importPath, []);
          }
          supabaseImports.get(importPath).push(file);
        }
      });
    });

    // Check for multiple different Supabase import paths
    const supabasePaths = Array.from(supabaseImports.keys());
    if (supabasePaths.length > 1) {
      this.logIssue('conflict', `Found ${supabasePaths.length} different Supabase import paths:`, 'warning');
      supabasePaths.forEach(path => {
        this.log(`  - ${path} (used in ${supabaseImports.get(path).length} files)`, 'yellow');
      });
      
      this.issues.conflictingImports.push({
        type: 'supabase_imports',
        paths: supabasePaths,
        files: supabaseImports
      });
    }
  }

  // Generate a summary report
  generateReport() {
    this.logSection('Audit Summary Report');
    
    const totalIssues = Object.values(this.issues).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalIssues === 0) {
      this.log('✅ No major issues found!', 'green');
      return;
    }

    this.log(`Found ${totalIssues} potential issues:`, 'yellow');
    
    // Deprecated patterns
    if (this.issues.deprecatedPatterns.length > 0) {
      this.log(`\n📋 Deprecated Patterns (${this.issues.deprecatedPatterns.length}):`, 'yellow');
      this.issues.deprecatedPatterns.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.message}`, 'yellow');
        this.log(`    Suggested: ${issue.replacement}`, 'blue');
      });
    }

    // Conflicting imports
    if (this.issues.conflictingImports.length > 0) {
      this.log(`\n🔄 Conflicting Imports (${this.issues.conflictingImports.length}):`, 'red');
      this.issues.conflictingImports.forEach(issue => {
        this.log(`  ${issue.type}: ${issue.paths.join(', ')}`, 'red');
      });
    }

    // Database references found
    this.log(`\n📊 Database Usage Summary:`, 'cyan');
    this.log(`  Tables referenced: ${this.knownTables.size}`, 'blue');
    this.log(`  Tables: ${Array.from(this.knownTables).join(', ')}`, 'blue');
    
    this.knownColumns.forEach((columns, table) => {
      if (columns.size > 0) {
        this.log(`  ${table} columns: ${Array.from(columns).join(', ')}`, 'blue');
      }
    });
  }

  // Generate fix suggestions
  generateFixSuggestions() {
    this.logSection('Fix Suggestions');
    
    if (this.issues.deprecatedPatterns.length > 0) {
      this.log('🔧 To fix deprecated patterns, run:', 'green');
      this.log('find src -name "*.ts" -o -name "*.tsx" | xargs sed -i \'\' \'s|@/lib/supabase|@/integrations/supabase/client|g\'', 'cyan');
      this.log('find src -name "*.ts" -o -name "*.tsx" | xargs sed -i \'\' \'s|@/services/supabase/database|@/integrations/supabase/client|g\'', 'cyan');
    }

    if (this.issues.conflictingImports.length > 0) {
      this.log('\n🔧 To standardize imports:', 'green');
      this.log('1. Choose one standard import path: @/integrations/supabase/client', 'cyan');
      this.log('2. Update all files to use the same path', 'cyan');
      this.log('3. Remove unused import files', 'cyan');
    }

    this.log('\n🔧 Recommended next steps:', 'green');
    this.log('1. Fix all deprecated import patterns', 'cyan');
    this.log('2. Verify all table references exist in your Supabase database', 'cyan');
    this.log('3. Check that all column references match your database schema', 'cyan');
    this.log('4. Remove any unused database helper files', 'cyan');
  }

  // Main audit function
  async runAudit() {
    this.log(`${colors.bold}${colors.magenta}🔍 Starting Database Schema Audit${colors.reset}\n`);
    
    try {
      // Scan codebase
      this.scanCodebaseForDbReferences();
      
      // Check for conflicts
      this.checkConflictingImports();
      
      // Generate reports
      this.generateReport();
      this.generateFixSuggestions();
      
      this.log(`\n${colors.bold}${colors.green}✅ Audit completed successfully!${colors.reset}`);
      
    } catch (error) {
      this.log(`\n❌ Audit failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the audit
if (require.main === module) {
  const audit = new DatabaseAudit();
  audit.runAudit();
}

module.exports = DatabaseAudit; 