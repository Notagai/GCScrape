# GCScrape

GCScrape is a local-first student dashboard for Google Classroom.

Current flow: Google OAuth sign-in, read-only Classroom access, encrypted HTTP-only local session, course list, and assignment/material retrieval.

The intended product role is student. A teacher account is only for creating test classes and sample coursework during development.

Local setup:
1. Create .env.local from .env.example.
2. Fill in the Google OAuth values.
3. Set SESSION_SECRET to a random secret of at least 32 characters.
4. Never commit .env.local, OAuth secrets, refresh tokens, or AI API keys.
5. Run npm.cmd run dev and open http://localhost:3000.

Local OAuth redirect URI: http://localhost:3000/api/auth/callback

Requested Classroom scopes:
- classroom.courses.readonly
- classroom.coursework.me.readonly
- classroom.courseworkmaterials.readonly
