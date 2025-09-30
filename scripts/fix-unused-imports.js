#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Aggressive unused import removal script
 * Uses TypeScript's language service to identify and remove unused imports
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

async function removeUnusedImports(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip if not an import line
      if (!line.trim().startsWith('import ') || line.includes('import type')) {
        newLines.push(line);
        continue;
      }

      // Extract imported items from import statement
      const importMatch = line.match(/import\s+(?:\{([^}]+)\}|(\w+)|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (!importMatch) {
        newLines.push(line);
        continue;
      }

      const namedImports = importMatch[1];
      const defaultImport = importMatch[2];
      const namespaceImport = importMatch[3];
      const modulePath = importMatch[4];

      let usedImports = [];

      if (defaultImport) {
        // Check if default import is used
        const defaultRegex = new RegExp(`\\b${defaultImport}\\b`, 'g');
        const usedInFile = content.substring(content.indexOf(line) + line.length).match(defaultRegex);
        if (usedInFile && usedInFile.length > 0) {
          usedImports.push(defaultImport);
        }
      }

      if (namespaceImport) {
        // Check if namespace import is used
        const namespaceRegex = new RegExp(`\\b${namespaceImport}\\.`, 'g');
        const usedInFile = content.substring(content.indexOf(line) + line.length).match(namespaceRegex);
        if (usedInFile && usedInFile.length > 0) {
          usedImports.push(`* as ${namespaceImport}`);
        }
      }

      if (namedImports) {
        // Check named imports
        const imports = namedImports.split(',').map(imp => imp.trim());
        const stillUsedImports = [];

        for (const imp of imports) {
          const cleanImport = imp.replace(/\s+as\s+\w+/, '').trim();
          const aliasMatch = imp.match(/(\w+)\s+as\s+(\w+)/);
          const importName = aliasMatch ? aliasMatch[2] : cleanImport;

          // Check if this import is used in the file
          const importRegex = new RegExp(`\\b${importName}\\b`, 'g');
          const restOfFile = content.substring(content.indexOf(line) + line.length);
          const usedInFile = restOfFile.match(importRegex);

          if (usedInFile && usedInFile.length > 0) {
            stillUsedImports.push(imp);
          }
        }

        if (stillUsedImports.length > 0) {
          usedImports.push(`{ ${stillUsedImports.join(', ')} }`);
        }
      }

      // Reconstruct import line with only used imports
      if (usedImports.length > 0) {
        const newImportLine = `import ${usedImports.join(', ')} from '${modulePath}';`;
        newLines.push(newImportLine);
        if (newImportLine !== line) {
          modified = true;
        }
      } else {
        // Remove entire import line if nothing is used
        modified = true;
        console.log(`Removed unused import: ${line.trim()} from ${filePath}`);
      }
    }

    if (modified) {
      await fs.promises.writeFile(filePath, newLines.join('\n'));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting aggressive unused import removal...');

  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = await findTsFiles(srcDir);

  console.log(`Found ${tsFiles.length} TypeScript files to process`);

  let modifiedCount = 0;
  let totalRemoved = 0;

  for (const file of tsFiles) {
    const modified = await removeUnusedImports(file);
    if (modified) {
      modifiedCount++;
    }
  }

  console.log(`✅ Modified ${modifiedCount} files`);
  console.log(`✅ Removed unused imports from ${modifiedCount} files`);

  // Run ESLint fix to clean up any formatting issues
  try {
    console.log('🔧 Running ESLint fix...');
    await execAsync('npm run lint:fix');
    console.log('✅ ESLint fix completed');
  } catch (error) {
    console.log('⚠️ ESLint fix had some issues, but continuing...');
  }
}

main().catch(console.error);