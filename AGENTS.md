# Agent Operations And Security Guide

This repository is a Firebase-backed static website for the ERICA Central Audit Committee. Agents working in this repository must treat code changes, Firebase configuration, and production operations as separate responsibilities.

This file is the single source of truth for agent behavior, security handling, validation, and production boundaries in this repository. Do not create a separate overlapping agent or security policy; update this file when the policy changes.

## Current Repository State

Snapshot date: 2026-07-10. Verify it with local commands before relying on it.

- The current branch is `main`, tracking `origin/main`, with a large unstaged working tree from the reliability, accessibility, security, and validation refactor.
- The working tree contains both modified and new files. Preserve all existing changes and create or switch to a feature branch before committing or pushing.
- No files are staged. No commit, push, pull request, deploy, production data write, credential change, or Firebase Rules deployment has been performed for the current refactor.
- `firestore.rules` and `storage.rules` were not changed by the current refactor.
- The only tracked secret-shaped file is `.env.example`, and it contains placeholders. `assets/js/firebase.js` contains public Firebase Web configuration, not server credentials. No tracked private-key block or service-account credential was found in the latest audit.
- The latest `npm run check` passed: 44 JavaScript files parsed, 27 HTML files plus 13 CSS and 53 referenced JavaScript files checked, and all 14 unit tests passed.
- The latest `git diff --check` passed with line-ending conversion warnings only.
- An interactive browser connection and a local Jekyll runtime were unavailable, so generated-site and signed-in administrator smoke testing remain manual pre-merge steps.
- The implementation details, validation evidence, and deferred risks are recorded in `docs/refactor-decision-record.md`.

## Role Boundary

Agents act as development practitioners, not production owners or operators.

Agents may:

- Inspect repository structure, configuration, rules, and local code.
- Edit application code, documentation, tests, and local rules files.
- Run local validation, syntax checks, lint checks, tests, and Firebase dry-run commands.
- Work on feature branches and prepare changes for review.
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

The required ignore baseline is:

- `.env`
- `.env.*`
- `!.env.example`
- `.secrets/`
- `firebase-service-account*.json`
- `*.service-account.json`
- `*serviceAccount*.json`
- `*service-account*.json`
- `*firebase-adminsdk*.json`
- `*.pem`, `*.key`, `*.p12`, and `*.pfx`
- `*-private-key.json`

## Required Secret Hygiene Checks

For security-sensitive work, inspect without printing secret values:

- `.env`, `.env.local`, `.env.*`, `.env.example`.
- `.secrets/`.
- Service account JSON files.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`.
- `.github/workflows` if present.
- Deployment configs, README, and this file.

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
- Admin permission is enforced through Firebase Auth plus Firestore and Storage Rules. Do not rely only on client-side UI checks or custom claims that are not aligned with deployed Rules.
- Firestore `permission-denied` may represent either Rules denial or App Check enforcement. Preserve the authenticated session on an indeterminate probe failure and provide explicit retry and logout actions.
- `firestore.rules` must keep unknown paths denied and must not permit broad unauthenticated writes.
- Public pages should read only published public content.
- Admin-only or internal collections must remain admin-only.
- Storage document files under `public/{documentType}/{documentId}/{fileName}` are intended for published public documents. Draft or deleted document files must not remain publicly readable.
- Document upload and legacy download URLs must match the configured Firebase Storage bucket and the document ID before they are used or deleted.
- Existing Firebase `getDownloadURL()` token URLs are long-lived share URLs. Changing Firestore status to draft does not revoke an already disclosed URL; token review or migration requires an approved production plan.
- Current `storage.rules` authorize published document paths by document status but do not bind reads to the document's exact current `filePath`. Treat known old or orphan paths as a Medium deferred risk until Rules design, existing-data audit, emulator testing, and deployment approval are complete.
- Rich text rendering must go through `sanitizeHtml`; do not insert admin-authored HTML directly with `innerHTML`.
- Avoid adding `style` to sanitizer allowed attributes unless the risk is documented and explicitly accepted.
- Public list queries are capped by `PUBLIC_QUERY_LIMIT` (currently 300) and some pages sort or filter after the capped read. Review server-side ordering, pagination, indexes, compatibility, and read cost before content volume can exceed that limit.
- Shared navbar and footer markup is maintained in `_includes/`; keep compatibility endpoints in `assets/components/` unless a migration explicitly removes them.

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
- Run `npm run check` for application, site, or validation-tooling changes. For documentation-only changes, still run `git diff --check` and use the full check when practical.
- Run `git diff --check`.
- If rules changed and Firebase CLI access is available, run only dry-run validation unless the user explicitly approves deploy.
- Confirm no secret files are staged.

## Risk Classification

Use these levels in reports and decision records:

- High: exposed private key or service account, production data deletion or modification risk, broad public write access, IAM/API key/service account/billing/quota changes, production deploy, or public exposure of sensitive personal data.
- Medium: public file access drift, App Check not enforced, API key restrictions not verified, auth/rules/client mismatch, query limits that may hide content, migration needed, or insufficient validation automation.
- Low: public Firebase Web config exposure, App Check site key exposure, project ID exposure, missing docs, missing CI, minor `.gitignore` gaps, or nonblocking code hygiene issues.

## Pre-Commit, Merge, And Deploy Checklist

Before committing or merging:

- Confirm the work is on a feature branch, not a direct `main` or `master` push.
- Review `git status`, staged files, untracked files, and `git diff --check`.
- Confirm no service account JSON, private key, token, real `.env`, or production credential is staged.
- Confirm `.gitignore` still protects the required local secret paths and credential patterns.
- Run `npm run check` and record the result in the refactor decision record when the change is substantive.
- Build with the GitHub Pages/Jekyll toolchain and smoke-test navigation with JavaScript enabled and disabled when that runtime is available.
- Smoke-test public document resolution, schedule/FAQ keyboard behavior, and administrator login, retry, logout, create, update, and delete flows in an environment with App Check.

Before any deployment or production operation:

- Confirm Security Rules deny broad unauthenticated writes and unknown paths.
- Confirm public pages cannot read applicant, student, administrator-only, or internal collections.
- Confirm App Check is registered and functioning before enabling or tightening enforcement.
- Confirm API key restrictions, authorized domains, quota or budget alerts, and live analytics/cookie behavior manually in the relevant consoles.
- Require dry-run or emulator evidence for Rules and migration changes.
- Obtain explicit user approval for Firebase Rules deployment, token revocation, production writes, migrations, or configuration changes.

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
