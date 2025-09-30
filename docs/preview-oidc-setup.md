# Preview Environment OIDC Setup (Guide)

This repository enables GitHub OIDC for CI/preview workflows. To use OIDC for preview secrets:

- Ensure workflows have OIDC permissions (already configured):
  - `permissions: id-token: write, contents: read`
- Prefer GitHub Environments with required reviewers and environment secrets for preview deployments.

Recommended steps
- Create an Environment in GitHub (e.g., `preview`).
- Add environment secrets as needed (examples):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
  - `BFF_URL`
  - `DATABASE_URL` (for policy tests if you want to run them)
- Add environment variables (non-secret) if desired: `BASE_URL` for E2E tests to target the preview URL.
- If you use a cloud provider for secrets (AWS/GCP/Azure), configure a trust relationship to GitHub OIDC for the repo and environment, then fetch those secrets in workflow steps using the provider’s CLI.

Notes
- Supabase preview databases and Edge Functions can be provisioned manually per PR or via CLI steps in the workflow if you prefer automatic preview deployments.
- Stripe CLI webhooks can be used locally to replay events; in CI, use contract tests only. 