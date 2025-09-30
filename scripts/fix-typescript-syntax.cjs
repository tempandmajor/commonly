#!/usr/bin/env node

/**
 * TypeScript quick syntax fixer (CommonJS)
 * - Removes broken "@ts-ignore TODO: ..." lines that cause parse errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Removing broken @ts-ignore TODO comments...');

const BROKEN_TS_IGNORE = /^\s*\/\/\s*@ts-ignore\s+TODO:.*$/gm;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(BROKEN_TS_IGNORE, '');
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Cleaned: ${path.relative(process.cwd(), filePath)}`);
    return 1;
  }
  return 0;
}

function walk(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (p.includes('node_modules') || p.includes('.next')) continue;
      count += walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      count += processFile(p);
    }
  }
  return count;
}

const srcDir = path.join(process.cwd(), 'src');
const cleaned = walk(srcDir);
console.log(`✨ Cleaned files: ${cleaned}`);

console.log('🔍 Running type check...');
try {
  execSync('npm run -s type-check', { stdio: 'inherit' });
} catch {}
