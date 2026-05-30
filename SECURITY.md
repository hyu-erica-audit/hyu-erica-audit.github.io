# Security Policy

## Firebase configuration

Firebase Web config values, including the web `apiKey`, auth domain, project ID, app ID, and App Check site key, are public client configuration. They are not a replacement for authorization. Protect Firebase resources with Security Rules, App Check enforcement, API key restrictions, and quota/budget controls.

## Sensitive secrets

The following values are sensitive and must not be committed, pasted into chat, printed in logs, or exposed in client-side code:

- Service account JSON files
- Private keys and Admin SDK credentials
- FCM server keys
- OAuth access tokens and refresh tokens
- `.env` files containing real credentials

Use `.secrets/` or local environment variables for local-only credentials. Keep `.env.example` free of real secret values.

## Codex operating boundary

Codex acts as a development practitioner for this project. Codex may inspect code, suggest changes, and edit local files, but the following actions require explicit user approval:

- Production deploys
- Firebase rules deploys
- Firebase Admin SDK writes, deletes, or migrations
- Changes to production data
- IAM, API key, service account, billing, quota, or domain changes
- Git commits, pushes, force pushes, and pull request creation

Codex must not loosen Security Rules to broad public read or write access.

## Pre-commit checklist

Before committing or deploying, confirm:

- No service account JSON, private key, token, or real `.env` file is staged.
- `.gitignore` still protects local secret paths and credential file patterns.
- Firebase rules continue to deny broad public writes and unknown document paths.
- Public pages do not read private applicant, student, or admin-only collections.
- Any Firebase rules deploy or production data operation has explicit user approval.
