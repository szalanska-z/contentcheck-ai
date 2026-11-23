# ContentCheck AI

ContentCheck AI helps editors review HTML before publishing. The Polish-language Nuxt application has local account registration, cookie-based sessions, and a private report history.

## Run locally

Use Node.js 24 and npm. Create a dedicated Neon development branch in the Neon console, select it in **Connect**, and copy its pooled PostgreSQL connection string. Create a private `.env` in the project root using [.env.example](.env.example).

| Variable | Local value |
| --- | --- |
| `DATABASE_URL` | Pooled connection string for the Neon development branch, including its TLS options |
| `BETTER_AUTH_SECRET` | Random value generated with the Node command in the example file |
| `BETTER_AUTH_URL` | `http://127.0.0.1:3000`, matching the address used by the browser |

```sh
npm ci
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:3000, select **Załóż konto**, and register a local test account. Sign out and sign in again, then open **Nowa analiza** or **Historia**. After signing out, visiting a panel URL should redirect to the login form and `GET /api/session` should return 401.

Open **Nowa analiza**, enter HTML or select **Wstaw przykład**, and run **Analizuj**. Enter a title and select **Zapisz raport**. The history supports title search, pagination, renaming, and removal. **Użyj ponownie** opens the stored HTML in a new draft.

```sh
npm run test:unit
npm run test:integration
npm run lint
npm run typecheck
npm run build
```

Unit tests cover analyzer rules, stable identifiers, and report input validation. Integration tests apply the checked-in migrations to fresh in-memory PostgreSQL databases using PGlite. They cover Better Auth and owner-scoped report queries. These tests require no Neon connection or OpenAI key.

## Authentication

The browser submits forms to the Better Auth Nitro catch-all route. The global panel guard loads `GET /api/session` with the incoming cookie during SSR and with same-origin cookies on client navigation. The endpoint calls the server session helper and returns only the account ID and name. Better Auth owns password hashing, expiry and logout. Authentication limits use the PostgreSQL `rate_limit` table. Sign-in allows five attempts per minute per IP, and sign-up allows three per ten minutes per IP. Vercel keys requests by its forwarding header, and local development uses the socket address.

Production builds require an HTTPS origin, use secure session cookies, and keep registration disabled. Configure and verify email delivery for verification and password recovery before enabling production registration. Configure the production branch and a distinct secret in the deployment environment. Apply reviewed migrations as a separate operation.

## Architecture and milestones

1. **Setup and UI.** Nuxt pages and layouts in `app/`, a fixture-backed composable, and a shared issue type in `shared/`.
2. **Database and authentication.** Nitro handlers in `server/api/`, Better Auth in `server/auth/`, the database client and schema in `server/db/`, and generated migrations in `drizzle/`.
3. **HTML analysis and history.** Add the shared parser and validation, server-side HTML analysis, user-owned report operations and database tests.
4. **AI suggestions.** Validate editorial segments and Responses API Structured Outputs. Persist a successful result and use a database-backed daily quota (initially five attempts per user) and a per-report generation claim.
5. **Quality and deployment.** Component and browser tests, accessibility review, documentation, GitHub, and Vercel with a separate Neon production branch.

### Data model

Better Auth CLI generated the `user`, `session`, `account`, `verification`, and `rate_limit` tables. Use `npm run db:auth-schema` when changing the Better Auth model, review the generated schema, and use `npm run db:generate` to generate SQL. Reports use the existing `analyses` table.

| `analyses` column | PostgreSQL type and purpose |
| --- | --- |
| `id` | UUID primary key |
| `user_id` | Foreign key to the Better Auth user |
| `title`, `original_html` | Text fields for the display name and immutable input |
| `issues`, `ai_suggestions` | JSONB snapshots of rule findings and optional suggestions |
| `ai_status`, `ai_model` | Generation status and optional model name |
| `source_analysis_id` | Nullable UUID referencing the earlier report |
| `created_at`, `updated_at` | Timestamps with time zone |

Index by `(user_id, created_at DESC, id DESC)` for stable history ordering. Use separate Neon branches for development and production. A reused report creates a new snapshot. The server verifies ownership of both the requested report and any supplied source report.

### Report API

| Method and route | Purpose |
| --- | --- |
| GET /api/analyses | Search and paginate the current user's report metadata |
| POST /api/analyses | Parse validated HTML server-side and create a snapshot |
| GET /api/analyses/:id | Return an owned snapshot |
| PATCH /api/analyses/:id | Rename an owned snapshot |
| DELETE /api/analyses/:id | Remove an owned snapshot |
| POST /api/analyses/:id/suggestions | Planned for the AI milestone |
| GET /api/dashboard | Return aggregate counts and the five latest reports |

Protected routes return 401 for missing sessions and 404 for both inaccessible and missing report IDs. The HTML analyzer uses parse5 to inspect a tree without executing scripts or loading resources. The browser uses the same rules for preview that the server uses to recalculate the saved findings. Generic link text requires contextual review. A report covers selected checks and cannot establish WCAG conformance.

## Screenshots

[Landing page](docs/screenshots/landing.jpg) · [Editor and results](docs/screenshots/analysis.jpg) · [Mobile editor](docs/screenshots/mobile.jpg)
