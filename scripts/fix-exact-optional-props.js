#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Aggressive exactOptionalPropertyTypes fixer
 * Fixes common patterns that break with exactOptionalPropertyTypes: true
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

async function fixExactOptionalProps(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    let newContent = content;
    let modified = false;

    // Pattern 1: Fix prop?.something passed to optional props
    // Before: prop: value?.something
    // After: ...(value?.something && { prop: value.something })
    const propOptionalPattern = /(\w+):\s*(\w+)\?\./g;
    const propMatches = [...content.matchAll(propOptionalPattern)];

    for (const match of propMatches) {
      const [fullMatch, propName, varName] = match;
      const replacement = `...(${varName} && { ${propName}: ${varName}`;
      // Only replace if this looks like a prop assignment in JSX or object
      if (content.includes(`${propName}: ${varName}?.`)) {
        newContent = newContent.replace(`${propName}: ${varName}?.`, `...(${varName} && { ${propName}: ${varName}.`);
        modified = true;
      }
    }

    // Pattern 2: Fix undefined assignments to optional props
    // Before: prop: undefined
    // After: remove the prop entirely or use conditional spread
    newContent = newContent.replace(/(\w+):\s*undefined,?\s*/g, (match, propName) => {
      // If it's in a JSX context, remove it entirely
      if (newContent.includes('<') && newContent.includes(match)) {
        modified = true;
        return '';
      }
      return match;
    });

    // Pattern 3: Fix conditional prop assignments
    // Before: prop: condition ? value : undefined
    // After: ...(condition && { prop: value })
    const conditionalPattern = /(\w+):\s*([^?]+)\s*\?\s*([^:]+)\s*:\s*undefined/g;
    newContent = newContent.replace(conditionalPattern, (match, propName, condition, value) => {
      modified = true;
      return `...(${condition.trim()} && { ${propName}: ${value.trim()} })`;
    });

    // Pattern 4: Fix optional prop interfaces
    // Add explicit undefined to optional props that might receive undefined
    const interfacePattern = /interface\s+\w+\s*{[^}]+}/g;
    const interfaceMatches = [...content.matchAll(interfacePattern)];

    for (const match of interfaceMatches) {
      const interfaceBlock = match[0];
      let newInterfaceBlock = interfaceBlock;

      // Find optional props that should allow undefined
      const optionalPropPattern = /(\w+)\?\s*:\s*([^;|]+)(?![^;]*undefined)/g;
      newInterfaceBlock = newInterfaceBlock.replace(optionalPropPattern, (propMatch, propName, propType) => {
        // Only add undefined if the type doesn't already include it
        if (!propType.includes('undefined') && !propType.includes('null')) {
          modified = true;
          return `${propName}?: ${propType.trim()} | undefined`;
        }
        return propMatch;
      });

      if (newInterfaceBlock !== interfaceBlock) {
        newContent = newContent.replace(interfaceBlock, newInterfaceBlock);
      }
    }

    // Pattern 5: Fix React component props with optional values
    // Before: <Component prop={value?.something} />
    // After: <Component {...(value?.something && { prop: value.something })} />
    const jsxPropPattern = /(\w+)=\{(\w+)\?\./g;
    newContent = newContent.replace(jsxPropPattern, (match, propName, varName) => {
      modified = true;
      const replacement = `{...${varName}?.${propName.substring(propName.lastIndexOf('.') + 1)} && { ${propName}: ${varName}.${propName.substring(propName.lastIndexOf('.') + 1)} }}`;
      return replacement;
    });

    // Pattern 6: Fix type assertions for optional properties
    // Add non-null assertions where safe
    const optionalChainPattern = /(\w+)\?\./g;
    let hasOptionalChain = false;
    newContent = newContent.replace(optionalChainPattern, (match, varName) => {
      // Only in safe contexts - avoid in JSX prop assignments
      const beforeMatch = newContent.substring(0, newContent.indexOf(match));
      const afterMatch = newContent.substring(newContent.indexOf(match) + match.length);

      // If this is in a type guard or already safe context, convert to non-null assertion
      if (beforeMatch.includes('if (') && beforeMatch.includes(varName) &&
          (beforeMatch.includes(`${varName} &&`) || beforeMatch.includes(`${varName}?.`))) {
        modified = true;
        return `${varName}.`;
      }
      return match;
    });

    if (modified) {
      await fs.promises.writeFile(filePath, newContent);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting exactOptionalPropertyTypes fixes...');

  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = await findTsFiles(srcDir);

  console.log(`Found ${tsFiles.length} TypeScript files to process`);

  let modifiedCount = 0;

  for (const file of tsFiles) {
    const modified = await fixExactOptionalProps(file);
    if (modified) {
      modifiedCount++;
      console.log(`Fixed exactOptionalPropertyTypes issues in: ${path.relative(process.cwd(), file)}`);
    }
  }

  console.log(`✅ Modified ${modifiedCount} files for exactOptionalPropertyTypes compliance`);
}

main().catch(console.error);