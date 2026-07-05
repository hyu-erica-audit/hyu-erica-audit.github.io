# Agent Operations Guide

This repository is a Firebase-backed static website for the ERICA Central Audit Committee. Agents working in this repository must treat code changes, Firebase configuration, and production operations as separate responsibilities.

## Role Boundary

Agents act as development practitioners, not production owners or operators.

Agents may:

- Inspect repository structure, configuration, rules, and local code.
- Edit application code, documentation, tests, and local rules files.
- Run local validation, syntax checks, lint checks, tests, and Firebase dry-run commands.
- Check whether secrets exist and whether they are ignored or tracked by Git.
- Report risk levels without printing secret values.

Agents must not do the following without explicit user approval:

- Push directly to `main` or `master`.
- Force push.
- Create pull requests.
- Deploy production changes.
- Deploy Firebase rules.
- Modify, delete, migrate, or bulk-update production data.
- Run Admin SDK scripts that write to production.
- Change IAM, Owner, Editor, Admin, service account, API key, billing, quota, domain, or deployment settings.
- Weaken Security Rules to broad public read or write access.

## Secret Handling

Never print, quote, summarize, or expose actual secret values.

Public client configuration may appear in client code:

- Firebase Web config, including web `apiKey`, auth domain, project ID, app ID, and measurement ID.
- App Check reCAPTCHA Enterprise site key.

These values do not grant admin access by themselves. Protect Firebase resources with Security Rules, App Check enforcement, authorized domains, API key restrictions, and budget or quota controls.

Sensitive credentials must never be committed, pasted into chat, logged, or exposed in client-side code:

- Firebase service account JSON.
- Private keys and Admin SDK credentials.
- FCM server keys.
- OAuth access tokens and refresh tokens.
- Real `.env` files or production credentials.
- Database credentials and connection strings.

Local-only credentials belong in `.secrets/` or local environment variables. `.env.example` must contain only safe placeholders.

## Required Secret Hygiene Checks

For security-sensitive work, inspect without printing secret values:

- `.env`, `.env.local`, `.env.*`, `.env.example`.
- `.secrets/`.
- Service account JSON files.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`.
- `.github/workflows` if present.
- Deployment configs, README, SECURITY docs, and this file.

Search indicators:

- `private_key`
- `BEGIN PRIVATE KEY`
- `service_account`
- `firebase-adminsdk`
- `FCM_SERVER_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `access_token`
- `refresh_token`
- `client_secret`

If a sensitive credential appears to be tracked by Git, stop and report before making unrelated changes.

## Firebase And Production Boundaries

Allowed without production deployment:

- `firebase deploy --only firestore:rules --dry-run --project PROJECT_ID`
- `firebase deploy --only storage --dry-run --project PROJECT_ID`
- Read-only inspections, counts, summaries, and mismatch reports that do not expose secrets.

Do not run without explicit user approval:

- `firebase deploy`
- `firebase deploy --only firestore:rules`
- `firebase deploy --only storage`
- `firebase firestore:delete`
- `firebase firestore:bulkdelete`
- Admin SDK writes, deletes, migrations, counter fixes, or bulk updates.

## Project-Specific Security Notes

- `assets/js/firebase.js` contains public Firebase Web config and the public App Check site key. Treat these as public client configuration, not private credentials.
- Admin permission is enforced through Firebase Auth plus Firestore and Storage Rules. Do not rely only on client-side UI checks.
- `firestore.rules` must keep unknown paths denied and must not permit broad unauthenticated writes.
- Public pages should read only published public content.
- Admin-only or internal collections must remain admin-only.
- Storage document files under `public/{documentType}/{documentId}/{fileName}` are intended for published public documents. Draft or deleted document files must not remain publicly readable.
- Rich text rendering must go through `sanitizeHtml`; do not insert admin-authored HTML directly with `innerHTML`.
- Avoid adding `style` to sanitizer allowed attributes unless the risk is documented and explicitly accepted.
- Public list queries are capped by `PUBLIC_QUERY_LIMIT`; if content volume grows, review pagination, ordering, and Firestore indexes before increasing read volume.

## Refactoring Rules

Every substantive refactor must update the refactor decision record.

Required update contents:

- Date.
- Summary of the refactor.
- Files or modules affected.
- Security impact.
- Operational impact.
- Validation commands and results.
- Known tradeoffs or deferred risks.
- Whether Firebase rules deploy or production data changes are required.

Before and after each refactor:

- Run `git status --short --branch`.
- Preserve user changes and do not revert unrelated edits.
- Run `npm run check` when JavaScript may be affected, or at minimum run `node --check` on changed JavaScript files.
- Run `git diff --check`.
- If rules changed and Firebase CLI access is available, run only dry-run validation unless the user explicitly approves deploy.
- Confirm no secret files are staged.

## Risk Classification

Use these levels in reports and decision records:

- High: exposed private key or service account, production data deletion or modification risk, broad public write access, IAM/API key/service account/billing/quota changes, production deploy, or public exposure of sensitive personal data.
- Medium: public file access drift, App Check not enforced, API key restrictions not verified, auth/rules/client mismatch, query limits that may hide content, migration needed, or insufficient validation automation.
- Low: public Firebase Web config exposure, App Check site key exposure, project ID exposure, missing docs, missing CI, minor `.gitignore` gaps, or nonblocking code hygiene issues.

## Final Reporting Format For Security-Sensitive Work

Report:

1. Current branch and Git status.
2. Keys, secrets, and permissions checked.
3. Changes made.
4. Changed files.
5. High / Medium / Low risks.
6. Validation and test results.
7. Actions intentionally not performed.
8. User approval or manual actions required.
9. Merge/deploy checklist.
