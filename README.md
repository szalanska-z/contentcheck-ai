# ContentCheck AI

ContentCheck AI helps editors review HTML before publishing. The current milestone is a Polish-language Nuxt interface with an explicitly labeled sample report.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Select **Wypróbuj demo**, insert the built-in HTML with **Wstaw przykład**, and select **Pokaż wyniki demo**. Use the category filters, then open **Historia** to revisit and reuse the sample. The account forms are demonstrations. Use dummy credentials.

```sh
npm run lint
npm run typecheck
npm run build
```

## Architecture and milestones

1. **Setup and UI.** Nuxt pages and layouts in `app/`, a fixture-backed composable, and a shared issue type in `shared/`.
2. **Database and authentication.** Nitro handlers in `server/api/`, Better Auth in `server/auth/`, the database client and schema in `server/db/`, and generated migrations in `drizzle/`.
3. **HTML analysis and history.** Add the shared parser and validation, server-side HTML analysis, user-owned report operations and database tests.
4. **AI suggestions.** Validate editorial segments and Responses API Structured Outputs. Persist a successful result and use a database-backed daily quota (initially five attempts per user) and a per-report generation claim.
5. **Quality and deployment.** Component and browser tests, accessibility review, documentation, GitHub, and Vercel with a separate Neon production branch.

### Planned data model

Generate Better Auth user, session, account and verification tables from the configured adapter.

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

### Planned API

| Method and route | Purpose |
| --- | --- |
| GET /api/analyses | Search and paginate the current user's report metadata |
| POST /api/analyses | Parse validated HTML server-side and create a snapshot |
| GET /api/analyses/:id | Return an owned snapshot |
| PATCH /api/analyses/:id | Rename an owned snapshot |
| DELETE /api/analyses/:id | Remove an owned snapshot |
| POST /api/analyses/:id/suggestions | Generate or return persisted suggestions |
| GET /api/dashboard | Return aggregate counts and the five latest reports |

Protected routes will return 401 for missing sessions and 404 for both inaccessible and missing report IDs. Public email registration depends on verification and password recovery. A report covers selected checks and cannot establish WCAG conformance.

## Screenshots

[Landing page](docs/screenshots/landing.jpg) · [Editor and results](docs/screenshots/analysis.jpg) · [Mobile editor](docs/screenshots/mobile.jpg)
