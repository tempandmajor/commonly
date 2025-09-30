#!/usr/bin/env node

/**
 * Automated TypeScript Syntax Fixer
 * Fixes common syntax errors across the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting TypeScript syntax fixes...\n');

const fixes = [
  {
    name: 'Fix malformed object spread',
    pattern: /\.\.\.(\([^)]+\s*&&\s*\{[^}]+\})([^}]+)\}/g,
    replacement: '...$1)',
  },
  {
    name: 'Fix incomplete object destructuring',
    pattern: /\.\.\.(\([^)]+\s*&&\s*\{[^}]+),\s*\/\/ @ts-ignore[^\n]+\n\s*}\);/g,
    replacement: '...$1 }),\n    });',
  },
  {
    name: 'Remove broken @ts-ignore comments',
    pattern: /\/\/ @ts-ignore TODO: Fix TS\d+[^\n]+\n/g,
    replacement: '',
  },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  fixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }

  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
      callback(filePath);
    }
  });
}

let fixedCount = 0;
const srcDir = path.join(process.cwd(), 'src');

walkDir(srcDir, (filePath) => {
  if (fixFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files\n`);

// Run type check to see remaining errors
console.log('🔍 Running type check...\n');
try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('\n✅ No TypeScript errors!');
} catch (error) {
  console.log('\n⚠️  Some TypeScript errors remain. Check output above.');
  process.exit(1);
}