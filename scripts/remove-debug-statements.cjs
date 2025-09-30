#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(__dirname, '../src'),
  path.join(__dirname, '../supabase/functions'),
];

const EXCLUDE_PATTERNS = [
  /\/test\//i,
  /\/tests\//i,
  /\.test\.[jt]sx?$/i,
  /\.spec\.[jt]sx?$/i,
  /\/scripts\//i,
];

const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

const DEBUG_REGEXES = [
  /console\.(log|warn|error|debug)\s*\([^;]*\);?/g,
  /debugger;?/g,
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  DEBUG_REGEXES.forEach((regex) => {
    content = content.replace(regex, '');
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!shouldExclude(fullPath)) {
        walk(fullPath);
      }
    } else if (
      FILE_EXTENSIONS.includes(path.extname(fullPath)) &&
      !shouldExclude(fullPath)
    ) {
      processFile(fullPath);
    }
  });
}

TARGET_DIRS.forEach((dir) => {
  if (fs.existsSync(dir)) {
    walk(dir);
  }
});

console.log('Debug statement removal complete.'); 