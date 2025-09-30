#!/bin/bash

# Fix common TypeScript errors in JSX/TSX files

# Find all TypeScript/TSX files
FILES=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \))

for file in $FILES; do
  # Fix missing opening braces in JSX expressions (e.g., "(expression)" -> "{(expression)}")
  # This pattern looks for lines like: ..."some text" (expression).method}...
  sed -i '' 's/\([^{]\)(\([^)]*\))\.\([a-zA-Z_][a-zA-Z0-9_]*\)([^)]*)}\([^}]\)/\1{(\2).\3()}\4/g' "$file"

  # Fix spread operator without braces (e.g., "...register(" -> "{...register(")
  sed -i '' 's/\([^{]\)\.\.\.\([a-zA-Z_][a-zA-Z0-9_]*\)(/\1{...\2(/g' "$file"

  # Fix conditional rendering without opening brace (e.g., "array.map(" -> "{array.map(")
  # Look for lines starting with whitespace followed by identifier.map/filter/etc without {
  sed -i '' 's/^\([[:space:]]*\)\([a-zA-Z_][a-zA-Z0-9_.]*\)\.map(/\1{\2.map(/g' "$file"
  sed -i '' 's/^\([[:space:]]*\)\([a-zA-Z_][a-zA-Z0-9_.]*\)\.filter(/\1{\2.filter(/g' "$file"

  # Fix expressions starting with ( that should start with {(
  # sed -i '' 's/^\([[:space:]]*\)(\([^)]*\))\.\([a-zA-Z_]\)/\1{(\2).\3/g' "$file"
done

echo "Basic fixes applied. Running tsc to check..."
npx tsc --noEmit