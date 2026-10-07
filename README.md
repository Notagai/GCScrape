# GCScrape

GCScrape is a local-first Google Classroom dashboard for organizing coursework.

## Current prototype

- Google OAuth 2.0 sign-in
- Read-only Google Classroom access
- Encrypted, HTTP-only local session cookie
- Course list dashboard
- Student coursework and classwork-material retrieval
- No Google credentials or refresh tokens committed to the repository

The intended product flow is for a student account. A teacher account can be useful for creating test classes and sample coursework, but the app should be tested with a student account before adding more features.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Google OAuth client ID and client secret.
3. Set `GOOGLE_REDIRECT_URI` to `http://localhost:3000/api/auth/callback`.
4. Generate a long random `SESSION_SECRET`.
5. Run `npm install` and `npm run dev`.
6. Open `http://localhost:3000`.

The Google OAuth client must have the same localhost redirect URI configured in Google Cloud.

## OAuth scopes

The prototype requests read-only Classroom scopes for courses, the signed-in user's coursework, and classwork materials.
