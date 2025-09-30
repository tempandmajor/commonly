#!/usr/bin/env tsx

/**
 * Advanced Supabase Schema Audit Script
 * 
 * This script connects to your Supabase database and compares
 * the actual schema with references found in your codebase.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Types for our audit results
interface AuditIssue {
  type: 'missing_table' | 'missing_column' | 'conflicting_import' | 'deprecated_pattern' | 'schema_mismatch';
  severity: 'error' | 'warning' | 'info';
  file?: string;
  message: string;
  suggestion?: string;
  details?: any;
}

interface DatabaseTable {
  table_name: string;
  columns: DatabaseColumn[];
}

interface DatabaseColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

interface CodeReference {
  table: string;
  columns: Set<string>;
  files: string[];
  operations: string[]; // select, insert, update, delete
}

class SupabaseSchemaAudit {
  private supabase: any;
  private issues: AuditIssue[] = [];
  private databaseTables: Map<string, DatabaseTable> = new Map();
  private codeReferences: Map<string, CodeReference> = new Map();
  private srcPath: string;

  constructor() {
    this.srcPath = path.join(process.cwd(), 'src');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      process.exit(1);
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private log(message: string, color: string = 'reset') {
    const colors: Record<string, string> = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m',
      bold: '\x1b[1m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private logSection(title: string) {
    this.log(`\n=== ${title} ===`, 'bold');
  }

  private addIssue(issue: AuditIssue) {
    this.issues.push(issue);
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
    const color = issue.severity === 'error' ? 'red' : issue.severity === 'warning' ? 'yellow' : 'blue';
    this.log(`${icon} ${issue.message}`, color);
    if (issue.suggestion) {
      this.log(`   💡 ${issue.suggestion}`, 'cyan');
    }
  }

  // Fetch actual database schema from Supabase
  async fetchDatabaseSchema() {
    this.logSection('Fetching Database Schema from Supabase');
    
    try {
      // Get all tables in the public schema
      const { data: tables, error } = await this.supabase.rpc('get_schema_tables', {
        schema_name: 'public'
      });
      
      if (error) {
        // Fallback: query information_schema directly
        const { data: tablesData, error: tablesError } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        if (tablesError) {
          throw new Error(`Failed to fetch tables: ${tablesError.message}`);
        }
        
        if (tablesData) {
          for (const table of tablesData) {
            await this.fetchTableColumns(table.table_name);
          }
        }
      } else if (tables) {
        for (const table of tables) {
          await this.fetchTableColumns(table.table_name);
        }
      }
      
      this.log(`Found ${this.databaseTables.size} tables in database`, 'green');
      
    } catch (error: any) {
      this.addIssue({
        type: 'schema_mismatch',
        severity: 'error',
        message: `Failed to fetch database schema: ${error.message}`,
        suggestion: 'Check your Supabase connection and permissions'
      });
    }
  }

  // Fetch columns for a specific table
  async fetchTableColumns(tableName: string) {
    try {
      const { data: columns, error } = await this.supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (error) {
        throw error;
      }
      
      this.databaseTables.set(tableName, {
        table_name: tableName,
        columns: columns || []
      });
      
    } catch (error: any) {
      this.addIssue({
        type: 'schema_mismatch',
        severity: 'warning',
        message: `Failed to fetch columns for table ${tableName}: ${error.message}`
      });
    }
  }

  // Scan codebase for database references
  scanCodebaseReferences() {
    this.logSection('Scanning Codebase for Database References');
    
    const files = this.getAllFiles(this.srcPath, ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      this.analyzeFileForDbReferences(file, content);
    }
    
    this.log(`Analyzed ${files.length} files, found ${this.codeReferences.size} table references`, 'blue');
  }

  private analyzeFileForDbReferences(filePath: string, content: string) {
    const relativePath = path.relative(this.srcPath, filePath);
    
    // Find Supabase queries
    const queryPattern = /supabase\s*\.\s*from\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    
    while ((match = queryPattern.exec(content)) !== null) {
      const tableName = match[1];
      
      if (!this.codeReferences.has(tableName)) {
        this.codeReferences.set(tableName, {
          table: tableName,
          columns: new Set(),
          files: [],
          operations: []
        });
      }
      
      const ref = this.codeReferences.get(tableName)!;
      if (!ref.files.includes(relativePath)) {
        ref.files.push(relativePath);
      }
      
      // Find operations and columns in the query chain
      this.extractQueryDetails(content, match.index, ref);
    }
    
    // Check for deprecated patterns
    this.checkDeprecatedPatterns(relativePath, content);
  }

  private extractQueryDetails(content: string, startIndex: number, ref: CodeReference) {
    // Extract the query chain starting from the .from() call
    const afterFrom = content.substring(startIndex);
    const queryEnd = this.findQueryEnd(afterFrom);
    const queryChain = afterFrom.substring(0, queryEnd);
    
    // Extract operations
    const operations = ['select', 'insert', 'update', 'delete', 'upsert'];
    operations.forEach(op => {
      if (queryChain.includes(`.${op}(`)) {
        if (!ref.operations.includes(op)) {
          ref.operations.push(op);
        }
      }
    });
    
    // Extract column references from select statements
    const selectMatches = queryChain.match(/\.select\(['"`]([^'"`]+)['"`]\)/g);
    if (selectMatches) {
      selectMatches.forEach(selectMatch => {
        const columnsStr = selectMatch.match(/\.select\(['"`]([^'"`]+)['"`]\)/)?.[1];
        if (columnsStr && columnsStr !== '*') {
          const columns = columnsStr.split(',').map(col => col.trim().split(' ')[0]);
          columns.forEach(col => {
            if (col && col !== '*') {
              ref.columns.add(col);
            }
          });
        }
      });
    }
    
    // Extract column references from update/insert operations
    const updateMatches = queryChain.match(/\.update\(([^)]+)\)/g);
    if (updateMatches) {
      updateMatches.forEach(updateMatch => {
        // This is a simplified extraction - in practice, you'd need more sophisticated parsing
        const updateContent = updateMatch.match(/\.update\(([^)]+)\)/)?.[1];
        if (updateContent) {
          // Extract object keys if it's a simple object literal
          const keyMatches = updateContent.match(/(\w+):/g);
          if (keyMatches) {
            keyMatches.forEach(keyMatch => {
              const key = keyMatch.replace(':', '');
              ref.columns.add(key);
            });
          }
        }
      });
    }
  }

  private findQueryEnd(queryChain: string): number {
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < queryChain.length; i++) {
      const char = queryChain[i];
      
      if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
      } else if (!inString) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ';' && depth === 0) return i;
        else if (char === '\n' && depth === 0 && !queryChain.substring(i + 1).trim().startsWith('.')) {
          return i;
        }
      }
    }
    
    return Math.min(queryChain.length, 500); // Reasonable limit
  }

  private checkDeprecatedPatterns(filePath: string, content: string) {
    const patterns = [
      {
        regex: /@\/lib\/supabase/g,
        message: 'Using deprecated @/lib/supabase import path',
        suggestion: 'Replace with @/integrations/supabase/client'
      },
      {
        regex: /@\/services\/supabase\/database/g,
        message: 'Using non-existent @/services/supabase/database import',
        suggestion: 'Replace with @/integrations/supabase/client'
      },
      {
        regex: /serverTimestamp/g,
        message: 'Using serverTimestamp which may not exist',
        suggestion: 'Use new Date().toISOString() instead'
      },
      {
        regex: /\.select\(['"`]\*['"`]\)/g,
        message: 'Using select(*) which can cause TypeScript issues',
        suggestion: 'Specify exact columns to avoid deep instantiation errors'
      }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.regex.test(content)) {
        this.addIssue({
          type: 'deprecated_pattern',
          severity: 'warning',
          file: filePath,
          message: `${filePath}: ${pattern.message}`,
          suggestion: pattern.suggestion
        });
      }
    });
  }

  // Compare code references with actual database schema
  validateSchemaConsistency() {
    this.logSection('Validating Schema Consistency');
    
    // Check for missing tables
    for (const [tableName, ref] of this.codeReferences) {
      if (!this.databaseTables.has(tableName)) {
        this.addIssue({
          type: 'missing_table',
          severity: 'error',
          message: `Table '${tableName}' referenced in code but not found in database`,
          suggestion: `Create table '${tableName}' or fix table name in: ${ref.files.join(', ')}`,
          details: { files: ref.files, operations: ref.operations }
        });
        continue;
      }
      
      // Check for missing columns
      const dbTable = this.databaseTables.get(tableName)!;
      const dbColumns = new Set(dbTable.columns.map(col => col.column_name));
      
      for (const columnName of ref.columns) {
        if (!dbColumns.has(columnName)) {
          this.addIssue({
            type: 'missing_column',
            severity: 'error',
            message: `Column '${columnName}' in table '${tableName}' referenced in code but not found in database`,
            suggestion: `Add column '${columnName}' to table '${tableName}' or fix column name`,
            details: { table: tableName, files: ref.files }
          });
        }
      }
    }
    
    // Check for unused tables (tables in DB but not referenced in code)
    for (const [tableName] of this.databaseTables) {
      if (!this.codeReferences.has(tableName)) {
        this.addIssue({
          type: 'schema_mismatch',
          severity: 'info',
          message: `Table '${tableName}' exists in database but is not referenced in code`,
          suggestion: 'Consider if this table is still needed or if references are missing'
        });
      }
    }
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    let files: string[] = [];
    
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

  // Generate detailed report
  generateReport() {
    this.logSection('Audit Report Summary');
    
    if (this.issues.length === 0) {
      this.log('✅ No issues found! Your schema is consistent.', 'green');
      return;
    }
    
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;
    const infoCount = this.issues.filter(i => i.severity === 'info').length;
    
    this.log(`\n📊 Found ${this.issues.length} total issues:`, 'yellow');
    this.log(`   ${errorCount} errors`, 'red');
    this.log(`   ${warningCount} warnings`, 'yellow');
    this.log(`   ${infoCount} info items`, 'blue');
    
    // Group issues by type
    const issuesByType = this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, AuditIssue[]>);
    
    Object.entries(issuesByType).forEach(([type, issues]) => {
      this.log(`\n📋 ${type.replace('_', ' ').toUpperCase()} (${issues.length}):`, 'cyan');
      issues.forEach(issue => {
        this.log(`   • ${issue.message}`, issue.severity === 'error' ? 'red' : 'yellow');
        if (issue.suggestion) {
          this.log(`     💡 ${issue.suggestion}`, 'cyan');
        }
      });
    });
  }

  // Generate actionable fix commands
  generateFixCommands() {
    this.logSection('Suggested Fix Commands');
    
    const deprecatedIssues = this.issues.filter(i => i.type === 'deprecated_pattern');
    if (deprecatedIssues.length > 0) {
      this.log('🔧 Fix deprecated import patterns:', 'green');
      this.log('find src -name "*.ts" -o -name "*.tsx" | xargs sed -i \'\' \'s|@/lib/supabase|@/integrations/supabase/client|g\'', 'cyan');
      this.log('find src -name "*.ts" -o -name "*.tsx" | xargs sed -i \'\' \'s|@/services/supabase/database|@/integrations/supabase/client|g\'', 'cyan');
    }
    
    const missingTables = this.issues.filter(i => i.type === 'missing_table');
    if (missingTables.length > 0) {
      this.log('\n🔧 Create missing tables in Supabase:', 'green');
      missingTables.forEach(issue => {
        this.log(`-- Create table: ${issue.message.match(/'([^']+)'/)?.[1]}`, 'cyan');
      });
    }
    
    const missingColumns = this.issues.filter(i => i.type === 'missing_column');
    if (missingColumns.length > 0) {
      this.log('\n🔧 Add missing columns:', 'green');
      missingColumns.forEach(issue => {
        const match = issue.message.match(/'([^']+)' in table '([^']+)'/);
        if (match) {
          this.log(`ALTER TABLE ${match[2]} ADD COLUMN ${match[1]} TEXT;`, 'cyan');
        }
      });
    }
  }

  // Main audit function
  async runAudit() {
    this.log('🔍 Starting Comprehensive Database Schema Audit\n', 'bold');
    
    try {
      // Step 1: Fetch actual database schema
      await this.fetchDatabaseSchema();
      
      // Step 2: Scan codebase for references
      this.scanCodebaseReferences();
      
      // Step 3: Validate consistency
      this.validateSchemaConsistency();
      
      // Step 4: Generate reports
      this.generateReport();
      this.generateFixCommands();
      
      this.log('\n✅ Audit completed successfully!', 'green');
      
      // Exit with error code if there are errors
      const hasErrors = this.issues.some(i => i.severity === 'error');
      if (hasErrors) {
        process.exit(1);
      }
      
    } catch (error: any) {
      this.log(`\n❌ Audit failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the audit
if (require.main === module) {
  const audit = new SupabaseSchemaAudit();
  audit.runAudit();
} 