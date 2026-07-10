# Refactor Decision Record

This file records refactor-related decisions and must be updated after every substantive refactor.

## 2026-07-10 - Agent And Security Policy Consolidation

### Summary

Consolidated the overlapping agent operating guide and security policy into `AGENTS.md` as the repository's single source of truth. Updated the guidance to reflect the current unstaged refactor, completed validation, secret-hygiene findings, manual testing gap, and known Firebase Storage and query-limit risks.

### Files Affected

- `AGENTS.md`
- `SECURITY.md` (removed after its unique requirements were integrated)
- `_config.yml` (exclude the consolidated policy from the generated site)
- `docs/refactor-decision-record.md`

### Security And Operational Impact

- Preserved all production-operation, secret-handling, Firebase Rules, App Check, and approval boundaries in one document.
- Added the verified ignore baseline and pre-commit, merge, and deploy checklists from the retired policy.
- Documented that the current `main` working tree is unstaged and must move to a feature branch before commit or push.
- Recorded the remaining long-lived download-token, Storage `filePath` binding, capped-query, Jekyll/browser smoke-test, and live-console verification work.
- No application code, Firebase Rules, production data, credentials, IAM, API keys, App Check enforcement, billing, quota, domains, or deployment settings were changed by this policy consolidation.

### Validation

- `npm run check`: passed; 44 JavaScript files parsed, 27 HTML files plus 13 CSS and 53 referenced JavaScript files checked, and 14 tests passed.
- `git diff --check`: passed with line-ending conversion warnings only.
- Confirmed that no files are staged and the current refactor changes remain preserved.

### Tradeoffs And Follow-Up

- The repository-state section in `AGENTS.md` is a dated snapshot and must not replace fresh `git status`, validation, and secret-hygiene checks.
- `SECURITY.md` is intentionally removed to prevent policy drift. Future agent and security policy changes belong in `AGENTS.md`.

## 2026-07-10 - Reliability, Accessibility, And Validation Refactor

### Summary

Reviewed the full static site, Firebase service layer, administrator interface, public page controllers, shared components, styles, and repository validation tooling. Refactored failure-prone write flows, aligned client authorization checks with deployed Rules behavior, removed several initialization races, isolated per-document download failures, improved keyboard and screen-reader behavior, made shared navigation available without runtime component fetches, and added dependency-free automated checks and unit tests.

### Files And Modules Affected

- Document lifecycle and shared services:
  - `assets/js/document-service.js`
  - `assets/js/document-file-utils.js`
  - `assets/js/firestore-utils.js`
  - `assets/js/service-factory.js`
  - `assets/js/greeting-service.js`
  - `assets/js/notice-service.js`
  - `assets/js/schedule-service.js`
  - `assets/js/contributor-service.js`
  - `assets/js/color-utils.js`
  - `assets/js/text-utils.js`
  - `assets/js/html-utils.js`
- Administrator authentication, initialization, editors, and entity screens:
  - `admin/index.html`
  - `assets/css/admin.css`
  - `assets/js/admin-auth.js`
  - `assets/js/pages/admin-login.js`
  - `assets/js/pages/admin-dashboard.js`
  - `assets/js/pages/admin/shared.js`
  - `assets/js/pages/admin/notices.js`
  - `assets/js/pages/admin/faq.js`
  - `assets/js/pages/admin/organization.js`
  - `assets/js/pages/admin/contributors.js`
  - `assets/js/pages/admin/documents.js`
- Public components, controllers, pages, and styles:
  - `_includes/navbar.html`, `_includes/footer.html`, `_includes/head-common.html`
  - `assets/components/navbar.html`, `assets/components/footer.html`
  - `assets/js/main.js`
  - `assets/js/pages/audit-info.js`
  - `assets/js/pages/schedule.js`
  - `assets/js/pages/faq.js`
  - `assets/js/pages/notice-view.js`
  - `assets/js/pages/document-page.js`
  - `assets/js/pages/download.js`
  - `assets/js/pages/rule.js`
  - public HTML files that now include the shared navbar and footer at build time
  - `assets/css/style.css`, `assets/css/schedule.css`, `assets/css/audit-info.css`
- Validation and documentation:
  - `package.json`
  - `scripts/check-js.mjs`
  - `scripts/check-site.mjs`
  - `test/*.test.mjs`
  - `README.md`
  - `docs/refactor-decision-record.md`

### Issues Addressed

#### 1. Firestore Write Timeouts Could Produce Duplicate Or Unknown Results

Risk level: Medium

The previous `Promise.race` timeout did not cancel the underlying Firestore operation, but it wrapped creates, updates, and deletes. A user could see a timeout, retry, and duplicate a write that later succeeded.

Decision:

- Renamed the helper to `withFirestoreReadTimeout` and limited it to reads.
- Directly await Firestore writes so the UI does not manufacture a failure while a write continues.
- Separated mutation errors from post-mutation refresh and form-reset errors in the administrator UI.

Tradeoff:

- A write may keep the administrator form busy longer during a poor network connection, but its result is no longer misclassified by an uncancellable client timeout.

#### 2. Document Storage And Firestore Updates Were Ordered Unsafely

Risk level: Medium

Replacement and deletion could leave a published Firestore document pointing at a deleted Storage object. Creates and failed replacements could also leave orphan objects.

Decision:

- Use a unique versioned Storage path for every new upload.
- Upload the replacement, resolve its URL, commit the new Firestore pointer, and only then clean up the old object.
- Compensate a new upload after a definitive metadata-write failure.
- Preserve the uploaded object and mark the result as unknown when a transient write error cannot prove whether metadata committed; the administrator is told to refresh before retrying.
- Stage document deletion as draft, derive a Storage path only from valid same-bucket legacy Firebase download URLs when `filePath` is missing, delete the object idempotently, and then delete Firestore metadata. Abort rather than silently orphaning a tokenized object when the path or bucket cannot be verified.
- Return and surface an old-file cleanup warning without describing a successful metadata update as failed.
- Validate `.pdf`, `.doc`, and `.docx` extension/MIME pairs and the Storage Rules `<25 MiB` limit before upload, and write canonical MIME metadata.

Tradeoff:

- Future replacements use new object paths. Old-object cleanup is best effort after the metadata commit and may require manual Storage review if cleanup fails.
- Cross-service operations are still not atomic. Deletion uses a recoverable draft intermediate state, while a replacement's UUID path can still be Rules-readable before the metadata pointer commits because the current Storage Rules authorize by document status rather than exact `filePath`.

#### 3. Client Administrator Checks Did Not Match Security Rules

Risk level: Medium

The client accepted an `admin` custom claim while Firestore and Storage Rules authorize a verified email allowlist. It also treated transient Rules-probe failures as authorization denial and signed out legitimate administrators.

Decision:

- Always verify access through a timeout-protected Firestore query governed by the actual Rules.
- Do not automatically sign out on a probe failure: Firestore Rules denial and enforced App Check failure can both surface as `permission-denied` in the web client.
- Keep the dashboard hidden, preserve the session, and offer explicit retry and logout actions for permission, network, timeout, App Check, or other indeterminate failures.
- Verify permission on the login page before redirecting to the dashboard.
- Keep the dashboard hidden until every initial section read succeeds, preventing late or failed responses from exposing forms backed by incomplete data.

#### 4. Administrator Mutation And Editor State Were Misleading

Risk level: Low-Medium

A successful mutation followed by a failed refresh could be reported as a failed mutation, encouraging duplicate retries. Initial default ordering was based on empty arrays, and rich-text placeholder markup could pass validation as non-empty.

Decision:

- Separate mutation, refresh, and reset phases and provide a distinct warning after a successful mutation with a failed refresh.
- If that refresh or reset fails, keep the affected form disabled and skip stale-state reset logic until the operator reloads the page.
- Calculate default order as `max(order) + 1` after data is loaded.
- Sanitize rich text before synchronizing it to storage and treat markup without meaningful text, images, or tables as empty.
- Add editor labels, upload progress ARIA values, and active-menu `aria-current` state.
- Preserve a notice's existing `publishedAt` timestamp during ordinary edits.
- Remove known legacy schedule and contributor fields with `deleteField()` when those records are edited.

#### 5. Public Pages Had All-Or-Nothing And Accessibility Failures

Risk level: Low-Medium

One failed Storage URL resolution hid every otherwise valid document. The schedule detail panel remained focusable while visually hidden and failed below 400px. FAQ search matched HTML tag names and lacked complete label/accordion relationships. The audit calendar always rendered five rows, dropping dates in six-week months. Notice errors retained fake metadata.

Decision:

- Resolve document URLs per item and render an unavailable state only for the failed item.
- Reuse the shared file-icon helper.
- Add schedule `hidden`, `inert`, and ARIA state, focus movement/restoration, Escape close, responsive width, reduced-motion behavior, and visible keyboard focus.
- Add FAQ labeling, live result status, complete accordion relationships, sanitized visible-text search, and distinct empty/no-match states.
- Calculate audit-calendar rows from month geometry and provide an accessible dated agenda.
- Hide and clear notice metadata on missing, deleted, or failed records.
- Select readable schedule event text colors and darken the low-contrast audit event color.

#### 6. Runtime Component Loading And CDN Coupling Reduced Resilience

Risk level: Low

Navigation, the skip link, and the footer existed only after JavaScript fetched HTML fragments. Pages that only needed text escaping also imported the remote DOMPurify module.

Decision:

- Make navbar and footer canonical Jekyll includes so they exist in built HTML without JavaScript.
- Keep the old component URLs as Jekyll-generated compatibility endpoints for cached or legacy pages.
- Keep a no-script mobile navigation fallback.
- Move dependency-free escaping into `text-utils.js`; only rich-text pages continue to require DOMPurify.
- Add the previously missing navigation link to the public regular-audit document page.

#### 7. Repository Checks Were Too Narrow And Misreported Environment Failures

Risk level: Low

The syntax checker spawned a Node process per file and reported sandbox `EPERM` errors as JavaScript syntax failures. There were no unit tests or static site reference checks.

Decision:

- Parse browser modules in-process with `SourceTextModule`.
- Check local links, CSS URLs, relative module imports, duplicate HTML IDs, unsafe `javascript:` references, missing `noopener`, HTML closing tags, Jekyll include targets, and front matter for Liquid-bearing files.
- Add in-process unit tests for date formatting, file icons, HTML escaping, Firestore read timeouts, document validation, and contrast text selection.
- Make `npm run check` run syntax, site, and unit checks together.

### Security Impact

- No broad read/write access was added and no Security Rules were changed.
- Client authorization now follows the Rules-backed result instead of trusting a mismatched custom-claim shortcut.
- File upload validation is stricter and rich-text editor output is sanitized before storage.
- No sensitive credential was found. Only `.env.example` was present and tracked, with placeholder values; ignore patterns cover real environment files, `.secrets/`, service-account files, private keys, and certificates.

Remaining Medium risk:

- The application still stores and renders Firebase `getDownloadURL()` token URLs. These are long-lived share URLs, so changing a Firestore document from published to draft does not revoke a URL already disclosed. A complete fix requires choosing a Rules-enforced download or controlled URL strategy, auditing compatibility/CORS, and reviewing or revoking existing tokens with explicit production approval.
- Storage Rules verify the document status but do not bind a request to the document's current `filePath`; old or orphan paths under the same document ID need a Rules design and existing-data audit before tightening.

### Operational Impact

- No Firebase Rules deployment is required for the code refactor itself because Rules files were not changed.
- A normal GitHub Pages publication is required before the static-site and client changes reach users.
- Future administrator edits to legacy schedules or contributors remove known legacy alias fields as part of the requested edit; no bulk migration is performed.
- No production document, Storage object, token, or Firestore record was inspected, changed, deleted, or migrated during this work.

### Validation Performed

- `npm run check`
  - parsed 44 browser JavaScript files;
  - checked 27 HTML files, 13 CSS files, and 53 JavaScript/module files;
  - passed 14 unit tests.
- `git diff --check`; passed with line-ending warnings only.
- Secret filename and indicator checks; no tracked private credential found.
- Local link/import and duplicate-ID checks; passed.
- A Jekyll runtime and an interactive browser connection were unavailable, so generated-page visual smoke testing remains a manual pre-merge step.

### Known Tradeoffs And Deferred Risks

- Public Firestore queries still cap an unordered subset at `PUBLIC_QUERY_LIMIT` before client-side sorting; document year filtering also occurs after the cap. Fixing this requires collection-specific ordering, pagination, index planning, data compatibility review, and read-cost review.
- The Firebase Rules validators still allow some optional/loosely formatted fields and do not have emulator tests.
- FullCalendar holiday data is still a fixed list and requires yearly maintenance.
- The privacy policy's cookie statement must be checked against the live Google Tag Manager container configuration.
- Remote Bootstrap, icons, fonts, FullCalendar, and DOMPurify assets are still external availability dependencies. Plain-text public lists no longer depend on DOMPurify.
- Automated visual, keyboard, screen-reader, Firestore Emulator, and Storage Emulator tests remain future work.

### Production Actions Not Performed

- No commit or push.
- No GitHub Pages or Firebase deployment.
- No Firestore or Storage Rules deployment.
- No production read/write/delete/migration or orphan cleanup.
- No download-token revocation.
- No IAM, API key, App Check enforcement, authorized-domain, billing, budget, quota, or service-account change.

### Follow-Up Checklist

- Review the full diff and run `npm run check` again after any merge conflict resolution.
- Build the site with the GitHub Pages/Jekyll toolchain and smoke-test navigation with JavaScript enabled and disabled.
- Keyboard-test schedule open/close and FAQ search/accordion behavior at 320px, 375px, 768px, 1024px, and desktop widths.
- Add Firestore/Storage Emulator tests before tightening Rules.
- Design and approve the download-token migration before changing public file access or revoking existing URLs.
- Manually verify App Check enforcement, API key restrictions, authorized domains, budget/quota alerts, and the live GTM cookie behavior.

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
