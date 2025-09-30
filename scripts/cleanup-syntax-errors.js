#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Cleanup script for syntax errors introduced during aggressive fixing
 */

async function findTsFiles(dir) {
  const files = [];

  async function traverse(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await traverse(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }

  await traverse(dir);
  return files;
}

async function fixSyntaxErrors(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    // Fix common syntax issues introduced by the scripts

    // Fix malformed template literals
    newContent = newContent.replace(/`[^`]*\$\{[^}]*$/, (match) => {
      if (!match.endsWith('`')) {
        modified = true;
        return match + '}`;';
      }
      return match;
    });

    // Fix broken type assertions
    newContent = newContent.replace(/as\s+string\s*\.\s*substr/g, 'as string).substr');
    modified = true;

    // Fix incomplete statements
    newContent = newContent.replace(/\s+as\s+string\s*$/gm, ' as string;');

    // Fix broken object destructuring
    newContent = newContent.replace(/\{\s*\.\.\.\s*\(/g, '{...(');

    // Fix environment variable references that were incorrectly modified
    newContent = newContent.replace(/process\.env\.NODE_ENV as string === production/g, "process.env.NODE_ENV === 'production'");
    newContent = newContent.replace(/process\.env\.NODE_ENV as string === development/g, "process.env.NODE_ENV === 'development'");
    modified = true;

    // Fix broken conditional spreads
    newContent = newContent.replace(/\.\.\.\([^)]+\s+&&\s+\{\s*[^}]*\s*\)/g, (match) => {
      // Ensure proper closing
      if (!match.includes('}')) {
        return match + '}';
      }
      return match;
    });

    // Fix malformed imports that got mangled
    newContent = newContent.replace(/import\s+\{\s*\.\.\./g, 'import {');

    // Fix broken JSX spreads
    newContent = newContent.replace(/\{\.\.\.([^}]+)\s*&&\s*\{\s*([^}]*)\s*\}\s*\}\s*\}/g, '{...$1 && { $2 }}');

    // Remove duplicate semicolons
    newContent = newContent.replace(/;;+/g, ';');

    // Fix incomplete template literals
    if (newContent.includes('`') && !newContent.match(/`[^`]*`/)) {
      const lines = newContent.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('`') && !line.match(/`[^`]*`/)) {
          // Try to fix incomplete template literal
          if (line.endsWith('`')) {
            // It's just an unclosed template
            continue;
          } else if (line.includes('`') && !line.includes('${')) {
            // Simple template literal, convert to string
            lines[i] = line.replace(/`([^`]*)/g, "'$1'");
            modified = true;
          }
        }
      }
      newContent = lines.join('\n');
    }

    if (modified) {
      await fs.promises.writeFile(filePath, newContent);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing syntax in ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting syntax error cleanup...');

  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = await findTsFiles(srcDir);

  console.log(`Found ${tsFiles.length} TypeScript files to check`);

  let fixedCount = 0;

  for (const file of tsFiles) {
    const fixed = await fixSyntaxErrors(file);
    if (fixed) {
      fixedCount++;
      console.log(`Fixed syntax errors in: ${path.relative(process.cwd(), file)}`);
    }
  }

  console.log(`✅ Fixed syntax errors in ${fixedCount} files`);

  // Run ESLint fix to clean up any remaining formatting issues
  try {
    console.log('🔧 Running ESLint fix...');
    await execAsync('npm run lint:fix');
    console.log('✅ ESLint fix completed');
  } catch (error) {
    console.log('⚠️ ESLint fix had some issues, but continuing...');
  }
}

main().catch(console.error);