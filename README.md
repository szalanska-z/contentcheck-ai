# ContentCheck AI

ContentCheck AI helps editors review HTML before publishing. The Polish-language Nuxt application has local account registration, cookie-based sessions, and a private report history.

## Problem and solution

Editors reviewing HTML in a CMS need a quick way to catch common markup issues and revisit the results. ContentCheck AI analyzes a pasted fragment, saves the original input and findings as a snapshot, and can suggest clearer wording for selected passages.

## Features

- Three automated checks for missing image alternatives, empty headings, and generic link text that needs contextual review.
- Account-specific history with title search, pagination, renaming, deletion, and reuse of previous HTML.
- Dashboard counts and recent reports from PostgreSQL.
- Optional language suggestions with saved results, an offline demo, and a persistent daily generation limit.

## Tech stack

Nuxt 4, Vue 3, TypeScript, Nitro, PostgreSQL on Neon, Drizzle, Better Auth, parse5, Zod, the OpenAI JavaScript SDK, and Resend for production authentication emails. Tests use Vitest, Nuxt Test Utils, Vue Test Utils, PGlite, and Playwright.

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
npm run test:components
npm run test:integration
npm run lint
npm run typecheck
npm run build
```

Unit tests cover analyzer rules, input validation, text extraction, and OpenAI SDK request and response handling with a fake transport. Integration tests apply the checked-in migrations to fresh in-memory PostgreSQL databases using PGlite. They cover Better Auth, owner-scoped report operations, suggestion persistence, and generation limits. These tests require no Neon connection or OpenAI key.

Component tests render Vue components with Nuxt's runtime and assert visible states, user interactions, and emitted events. For the full browser flow, install Chromium once and run Playwright.

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts a separate Nuxt server on port 3210 with a migrated in-memory database and demo suggestions. It exercises signup, source analysis, saved suggestions, reopening history, HTML reuse, logout, and signing in again. GitHub Actions runs the checks on pull requests and updates to `develop` or `main`.

## Authentication

The browser submits forms to the Better Auth Nitro catch-all route. The global panel guard loads `GET /api/session` with the incoming cookie during SSR and with same-origin cookies on client navigation. The endpoint calls the server session helper and returns only the account ID and name. Better Auth owns password hashing, expiry and logout. Authentication limits use the PostgreSQL `rate_limit` table. Sign-in allows five attempts per minute per IP, and sign-up allows three per ten minutes per IP. Vercel keys requests by its forwarding header, and local development uses the socket address.

Production builds require an HTTPS origin and use secure session cookies. Public signup requires explicitly enabled email delivery. When enabled, Better Auth sends a verification link before login and revokes existing sessions after a password reset. Unverified local accounts are intended for development.

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
| POST /api/analyses/:id/suggestions | Generate or return saved suggestions for an owned report |
| GET /api/dashboard | Return aggregate counts and the five latest reports |

Protected routes return 401 for missing sessions and 404 for both inaccessible and missing report IDs. The HTML analyzer uses parse5 to inspect a tree without executing scripts or loading resources. The browser uses the same rules for preview that the server uses to recalculate the saved findings. Generic link text requires contextual review. A report covers selected checks and cannot establish WCAG conformance.

## AI suggestions

Run `npm run db:migrate` against the Neon development branch for the AI migration. With `NUXT_AI_MODE=demo` (the default), use **Wstaw przykład** in the editor, save a new report, and choose **Pokaż sugestie demo** on the report. The demo produces a prepared rewrite for the example paragraph and works offline.

| Variable | Purpose |
| --- | --- |
| `NUXT_AI_MODE` | `demo` or `live` |
| `NUXT_OPENAI_API_KEY` | OpenAI project API key from the OpenAI platform settings, for live mode |
| `NUXT_OPENAI_MODEL` | A model available to the project that supports Structured Outputs |
| `NUXT_AI_ALLOW_PRODUCTION_LIVE` | Keep `false` until production live use is explicitly enabled |

Live mode uses the Responses API with Structured Outputs and a 15-second SDK timeout. Configure spending controls on the OpenAI project before enabling production live traffic. The server extracts at most 10 editorial segments totaling 3,000 characters and requests at most three suggestions. It checks returned source IDs and original text against the input. A successful result, including an empty list, is stored and reused.

Each account gets five started generations per UTC day, including provider failures. PostgreSQL atomically reserves a quota slot and a temporary claim on the report. A repeated request can return a saved result without consuming quota. An expired claim allows recovery after a worker stops before it saves the result.

Reports and their suggestions remain in PostgreSQL until the user deletes the report. Live generation sends selected editorial text to OpenAI when the user requests suggestions. The application requests `store: false` on each call. OpenAI's API data handling is described in its [data controls documentation](https://developers.openai.com/api/docs/guides/your-data).

## Deployment

1. Create a dedicated Neon production branch with its own connection string and confirm the target before applying migrations. Run `npm run db:migrate` against that connection as a separate operation. Keep local `.env` pointed at development.
2. Import the GitHub repository in Vercel with the Nuxt preset and `main` as the production branch. Use Node 24 and the default SSR build, `npm run build`.
3. Add the server environment variables in **Settings → Environment Variables**. Set a separate `DATABASE_URL` and `BETTER_AUTH_SECRET` for each environment and set `BETTER_AUTH_URL` to the exact HTTPS origin that will serve auth. Preview deployments need their own stable origin and database configuration if they are used to test login.
4. To enable public signup, verify a sender domain in Resend and add a sending key as `RESEND_API_KEY`. Set `AUTH_EMAIL_FROM` to an address on that domain. Set `AUTH_ENABLE_PUBLIC_SIGNUP=true` after configuring delivery. Start in `NUXT_AI_MODE=demo`.
5. Redeploy after setting environment variables. Use an account you control to check signup, email verification, login, password reset, logout, report creation, history, reuse, and demo suggestions. Verify that a second account cannot open the first account's report and that the panel works at a phone viewport. Test a live suggestion separately if you have enabled live mode.

## Security considerations

Report queries are scoped to the account from a verified server-side session. Mutating report routes validate input and check the request origin when supplied. User HTML is parsed as data and displayed as text. Production signup and live AI calls are opt-in. Keep database URLs, session secrets, and provider keys in private environment variables.

## Limitations and future work

The markup report covers three automated rules. It cannot establish WCAG conformance or determine whether a text alternative fits the context. Language suggestions require editorial review. The MVP is focused on pasted HTML and individual account history. Future work could add more rules with documented false positives and expand keyboard and assistive technology coverage.

## Screenshots

[Landing page](docs/screenshots/landing.jpg) · [Editor and results](docs/screenshots/analysis.jpg) · [Mobile editor](docs/screenshots/mobile.jpg) · [Demo suggestions](docs/screenshots/ai-suggestions-demo.jpg)
