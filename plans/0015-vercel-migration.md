# Plan 0015: viewer hosting moves to Vercel (audit.corewise.academy)

**Goal:** owner decision: move the fleet-audit viewer off GitHub Pages to
Vercel with the custom domain audit.corewise.academy.

## Already done outside the repo (Vercel CLI, this session)

- Project `ryanportfolio-audit` created and linked; production deploy live.
- Domain audit.corewise.academy attached and verified (corewise.academy
  nameservers already on Vercel DNS; no manual records needed).
- GitHub repo connected: pushes to main deploy production, PRs get
  preview deployments.

## Scope (this PR)

- `vercel.json`: install skipped at root, build `cd app && npm ci && npm
  run build:site`, output `site/dist`.
- `.gitignore`: `.vercel/` (local project link).
- Remove `.github/workflows/pages.yml` (Pages retired; single deploy path).
- README: viewer URL becomes audit.corewise.academy; workflows row says
  Vercel deploy.

## Verification

- Live checks: audit.corewise.academy index lists 10 reports; report page
  returns 200. Gate green. Post-merge: Vercel production deployment
  triggers from the merge commit.
