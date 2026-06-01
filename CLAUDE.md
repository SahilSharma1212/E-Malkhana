# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (uses Turbopack)
- `npm run build` — production build
- `npm start` — run the built app
- `npm run lint` — run ESLint (`eslint-config-next`)

There is no test runner configured.

## Required environment variables

`.env` (or `.env.local`) must define, at minimum:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client (used both client- and server-side; only the anon key is wired up).
- `JWT_SECRET` — symmetric secret used by both `jsonwebtoken` (issuing) and `jose` (verifying in middleware). Both must read the same value.
- `NEXT_PUBLIC_FIREBASE_*` — Firebase Web SDK config for the optional Google OAuth flow.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — only needed if `src/lib/firebaseAdmin.ts` is imported; not used by current routes.

## High-level architecture

This is a Next.js 15 App Router app (React 19, TypeScript, Tailwind v4) for tracking police evidence ("E-Malkhana"). State of record is **Supabase**; Firebase is used only for the optional Google sign-in popup.

### Auth and routing — middleware is the gatekeeper

`src/middleware.ts` runs on every non-API page request (matcher excludes `/api`, `/_next`, static files). It is where almost all auth and a major routing decision live:

1. Reads `token` cookie. No token → redirect to `/sign-in` (allows `/sign-in` and `/otp-login` through).
2. Verifies the JWT with `jose` using `JWT_SECRET`.
3. **Re-validates** the decoded `email` against `officer_table` in Supabase on every request — a valid signature alone is not enough; the officer must still exist.
4. If on `/sign-in` or `/otp-login` with a valid token → redirect to `/admin`.
5. Special case for `/`: if the **full request URL** matches a row in `property_table.qr_id`, redirect to `/search-property/{property_id}`. QR codes are stored as the entire URL (e.g. `https://.../?qrId=<uuid>`), not just the id — keep this in mind when generating or querying QR codes (see `handleQRGeneration` in `src/app/admin/page.tsx`).

JWT payload shape used everywhere downstream: `{ name, role, thana, email, created_at, phone }`. Client code fetches it via `GET /api/get-token`, which decodes and returns `user` from the cookie.

### Login flows

Three sign-in paths feed into the same cookie-based session:

- **Email + password** (`POST /api/login`) — looks up `officer_table` by email, compares the plain `password` column, issues the JWT cookie. Passwords are stored as plain text in the `password` column (a deliberate choice; bcrypt was intentionally removed). New users get a password via the admin Create User form; an admin can reset via `POST /api/update-password`.
- **Google OAuth** (`/sign-in` page → Firebase popup → `POST /api/verify-user`) — Firebase returns an email, which is checked against `officer_table`; if present, a JWT cookie is minted. No Firebase ID-token verification is done server-side.
- **OTP** (`/otp-login`) — UI-only dummy; not functional.

Sign-out: `POST /api/sign-out` clears the cookie. The Navbar polls `/api/get-token` to decide what to show.

### Role model

Stored as `officer_table.role`, lowercase strings: `viewer`, `thana admin`, `admin`, `super admin`. Roles are checked client-side in `src/app/admin/page.tsx` to gate UI sections; API routes generally don't re-check roles, so a malicious client could call most admin APIs directly — assume the threat model trusts authenticated officers. `thana admin` is scoped to their own `thana`; `admin` and `super admin` get a thana selector populated by `/api/fetch-thana-admin`.

### Data model (Supabase tables)

- `officer_table` — users. Key cols: `officer_name`, `email_id`, `phone`, `role`, `thana`, `password`, `updated_by`, `updated_at`.
- `property_table` — one row per evidence item / blank QR. Key cols: `property_id`, `qr_id` (full URL), `police_station`, `image_url[]`, `pdf_urls[]`, `isDismantled`, `special_category_*`, plus seizure metadata.
- `status_logs_table` — append-only log of property status changes, joined to `property_table` by `property_id`. Carries its own `pdf_url[]`.
- `thana_rack_box_table` — one row per thana, with `racks[]` and `boxes[]` arrays.

When deleting a property (`clearPropertyRecords` in admin page), the code must clean up: storage objects referenced from `property_table.image_url`, `property_table.pdf_urls`, and `status_logs_table.pdf_url` across **all** log rows, then null fields in `property_table`, then delete from `status_logs_table`. Setting `property_id = null` is the soft-delete signal — rows are reused for new QRs.

### File-storage convention

Supabase Storage URLs follow `…/storage/v1/object/public/<bucket>/<path>`. Deletion code in the admin page parses the URL by splitting on `/`, finding `public`, and treating the next segment as the bucket. Don't break this URL shape elsewhere.

## Repo conventions worth knowing

- `scripts/` is gitignored — holds local one-off helper scripts (DB inserts/updates) that may embed credentials. Don't import from it.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Both `jose` (middleware) and `jsonwebtoken` (API routes) are used; they must share `JWT_SECRET`.
- The Supabase client is a single shared instance from `src/config/supabaseConnect.ts` using the anon key — there is no service-role client. Schema changes (e.g. adding columns) must be done in the Supabase dashboard, not from app code.
