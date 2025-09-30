#!/usr/bin/env node
 
const { execSync } = require('child_process');

const sensitiveTables = [
  'payment_methods',
  'ledger_entries',
  'ledger_transactions',
  'stripe_customers',
  'stripe_subscriptions',
  'stripe_events',
  'outbox_events',
  'outbox_dead_letter',
  'idempotency_keys'
];

function hasRg() {
  try {
    execSync('rg --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const useRg = hasRg();
let failed = false;

for (const table of sensitiveTables) {
  try {
    let out = '';
    if (useRg) {
      out = execSync(`rg -n "from\\(['\"\"]${table}['\"\"]\\)" --glob "**/*.{ts,tsx,js,jsx}"`, { encoding: 'utf8' });
    } else {
      // grep fallback (basic, may overmatch slightly)
      out = execSync(`grep -RIn "from\\(['\"\"]${table}['\"\"]\\)" --include=*.ts --include=*.tsx --include=*.js --include=*.jsx .`, { encoding: 'utf8' });
    }
    const lines = out
      .split('\n')
      .filter(Boolean)
      .filter(l => !l.includes('/supabase/functions/') && !l.includes('/bff/') && !l.includes('/services/api/') );
    if (lines.length) {
      console.error(`Sensitive table direct access found for ${table}:`);
      lines.forEach(l => console.error('  ', l));
      failed = true;
    }
  } catch {
    // search returns non-zero when no matches; ignore
  }
}

if (failed) {
  console.error('\nSensitive access audit failed. Ensure all mutations go through BFF/Edge Functions.');
  process.exit(1);
}

console.log('Sensitive access audit passed.'); 