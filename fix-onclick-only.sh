#!/bin/bash

# Fix only onClick=() patterns (not other spread operators)
# This is a safer, more targeted fix

set -e

echo "🔧 Fixing onClick=() syntax errors..."

# Fix onClick=() => to onClick={() =>
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 perl -i -pe 's/onClick=\(\)\s*=>/onClick={() =>/g'

# Fix onSelect=() => to onSelect={() =>
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | xargs -0 perl -i -pe 's/onSelect=\(\)\s*=>/onSelect={() =>/g'

echo "✅ onClick/onSelect fixes complete!"

# Count remaining errors
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "📈 Remaining TypeScript errors: $ERROR_COUNT"