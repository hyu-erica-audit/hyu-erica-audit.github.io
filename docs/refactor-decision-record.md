# Refactor Decision Record

This file records refactor-related decisions and must be updated after every substantive refactor.

## 2026-07-05 - Post-Refactor Risk Fixes And Agent Guidance

### Summary

Reviewed the Firebase static site after a broad refactor and addressed issues that were safe to fix in the repository without deploying production changes or modifying production data.

### Files Changed

- `assets/js/html-utils.js`
- `assets/js/firestore-utils.js`
- `storage.rules`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/refactor-decision-record.md`
- `package.json`
- `scripts/check-js.mjs`

### Issues Addressed

#### 1. Rich Text Sanitizer Allowed Inline Styles

Risk level: Medium-Low

The shared sanitizer allowed the `style` attribute in admin-authored rich text. DOMPurify still reduces XSS risk, but inline styles can distort official pages, hide content, or create misleading presentation.

Decision:

- Removed `style` from the sanitizer allowed attributes.
- Kept `class` for existing layout compatibility.
- Added an explicit URI allow pattern for sanitized rich text links and image sources.

Tradeoff:

- Existing rich text content that relies on inline styles may render with less formatting.
- This is acceptable because official page integrity is more important than preserving arbitrary inline styling.

#### 2. Firestore Timeout Helper Left Timers Alive

Risk level: Low

The timeout helper used `Promise.race` but did not clear the timeout after the Firestore request settled.

Decision:

- Store the timeout ID.
- Clear the timer in `.finally()`.

Tradeoff:

- No behavioral change is expected except cleaner runtime behavior.

#### 3. Published Storage Files Were Always Public

Risk level: Medium

Storage files under `/public/**` were publicly readable even when the related Firestore document became draft, unpublished, or deleted.

Decision:

- Changed Storage Rules so public file reads require either:
  - the matching Firestore `documents/{documentId}` document to exist with `status == "published"`, or
  - an authenticated admin user.

Tradeoff:

- This rule change requires Firebase Storage Rules deployment before it affects production.
- The rule assumes public document files keep using paths that include the Firestore document ID: `public/{documentType}/{documentId}/{fileName}`.

### Issues Reviewed But Not Changed In Code

#### Public Query Limit And Client-Side Sorting

Risk level: Medium

Public collection reads are capped by `PUBLIC_QUERY_LIMIT` and sorted client-side. If published content grows beyond the cap, public pages may omit older or relevant items before sorting.

Decision:

- Did not change query behavior in this pass because fixing it properly requires data-specific ordering, possible Firestore indexes, and a review of read-cost impact.
- Documented this as a project-specific caution in `AGENTS.md`.

Recommended future work:

- Add explicit `orderBy` rules per collection where the intended ordering is simple.
- Create and dry-run required Firestore indexes.
- Avoid increasing `PUBLIC_QUERY_LIMIT` without estimating read-cost impact.

#### Missing Repeatable JavaScript Validation

Risk level: Low

The project did not include a package script or CI workflow for repeatable checks.

Decision:

- Added a dependency-free `npm run check` command.
- Added `scripts/check-js.mjs`, which runs `node --check` over `assets/js/**/*.js`.
- Did not add CI in this pass to avoid changing the repository's deployment workflow without approval.

Recommended future work:

- Add a GitHub Actions workflow only after the maintainer approves the desired CI behavior.

### Validation Performed

- Ran `npm run check`; all JavaScript files passed syntax checks.
- Ran `git diff --check`; passed with line-ending warnings only.
- Ran `firebase deploy --only storage --dry-run --project hyu-audit`; Storage Rules compiled successfully and dry-run completed.

### Production Actions Not Performed

- No commit.
- No push.
- No Firebase deploy.
- No rules deploy.
- No production data read/write/delete/migration.
- No IAM, API key, service account, billing, quota, domain, or infrastructure changes.

### Follow-Up Checklist

Before merge or deploy:

- Run JavaScript syntax checks.
- Run `git diff --check`.
- Dry-run Storage Rules deployment if Firebase CLI access is available.
- Review the Storage Rules change before deploying because it changes public file access behavior.
- Confirm no secret files are staged.
