#!/bin/bash

# Comprehensive TypeScript syntax error fix script
# Fixes multiple common syntax patterns that cause TypeScript compilation errors

set -e

echo "🔧 Starting comprehensive TypeScript syntax fixes..."

# Pattern 1: Fix onClick=() to onClick={() =>
echo "📝 Fixing onClick=() patterns..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/onClick=()[ ]*=>/onClick={() =>/g' \
  {} \;

# Pattern 2: Fix onSelect=() to onSelect={() =>
echo "📝 Fixing onSelect=() patterns..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/onSelect=()[ ]*=>/onSelect={() =>/g' \
  {} \;

# Pattern 3: Fix other event handlers with missing {}
echo "📝 Fixing other event handler patterns..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/onChange=()[ ]*=>/onChange={() =>/g' \
  -e 's/onSubmit=()[ ]*=>/onSubmit={() =>/g' \
  -e 's/onBlur=()[ ]*=>/onBlur={() =>/g' \
  -e 's/onFocus=()[ ]*=>/onFocus={() =>/g' \
  {} \;

# Pattern 4: Fix malformed spread in object context: {(expr && to ...(expr &&
echo "📝 Fixing object spread patterns..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/{\(user && {\)/...(\1/g' \
  -e 's/{(\([a-zA-Z_][a-zA-Z0-9_]* && {\)/...(\1/g' \
  {} \;

# Pattern 5: Fix incomplete spread syntax like ...value?.from && {
echo "📝 Fixing incomplete spread syntax..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/\.\.\.\([a-zA-Z_][a-zA-Z0-9_?.]*\) && {/{...(\1 \&\& {/g' \
  {} \;

# Pattern 6: Fix template literal issues in wallet balance
echo "📝 Fixing template literal syntax..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/`\$\$(/`\${/g' \
  {} \;

echo "✅ Syntax fixes complete!"
echo "📊 Running TypeScript compiler to check remaining errors..."

# Count errors before and after
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
echo "📈 Remaining TypeScript errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -lt 100 ]; then
  echo "🎉 Great progress! Under 100 errors remaining."
else
  echo "📋 Still working through errors. Run script again or fix remaining issues manually."
fi