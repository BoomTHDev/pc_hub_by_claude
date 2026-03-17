# Handoff for Claude Opus 4.6 in Antigravity

## 1. Project Overview

**PC Hub** is a full-stack e-commerce web application for selling computer hardware. It supports three roles:

- **Customer** — browse products, manage addresses, add to cart, checkout, upload PromptPay slips, view orders
- **Staff** — review orders and payments, operate backoffice workflows, view reports
- **Admin** — all staff capabilities plus privileged user management and broader backoffice administration

This repository is a monorepo with:

- `apps/web` — Angular 21 frontend
- `apps/api` — Express 5 + TypeScript backend
- `docs/` — project rules, architecture, DB schema, API spec, testing, security, phase plans
- `CLAUDE.md` — highest-priority project instructions for coding work

Treat the **current repository state** as the source of truth over this handoff if any discrepancy appears.

---

## 2. Current Repository State

At handoff time, the repository had:

- branch: `main`
- HEAD: `aa05105`
- a clean working tree when last verified locally

Do **not** assume remote sync blindly. First verify:

```bash
git status
git log --oneline --decorate -5
git remote -v
```

If the next model is working from a different checkout or later commit, trust the repo state over this document.

---

## 3. Architecture Summary

### Backend (`apps/api`)

Pattern: **Route → Controller → Service → Prisma**

Key characteristics:

- Controllers are intentionally thin
- Business logic lives in services
- Request bodies, params, queries, and env vars are validated with Zod
- Authentication uses JWT access + refresh tokens
- Role checks use auth middleware and `requireRole(...)`
- Global error middleware produces structured API errors
- Prisma is used with MySQL 8 via the MariaDB adapter path already configured in code

### Frontend (`apps/web`)

Pattern: **Angular standalone components + signals + lazy-loaded routes**

Key characteristics:

- Angular 21 standalone components
- State uses `signal()`, `computed()`, `input()`, `output()`, `inject()`, `viewChild()`
- All inline templates were extracted into sibling `.html` files
- Tailwind classes live in `.html`, not in `.ts`
- Shared UI primitives live under `apps/web/src/app/shared/components/`

### Data Flow

```
Angular frontend → Express API → Prisma → MySQL
```

Uploads go through the API to Cloudinary. PromptPay QR is generated server-side, then customers upload payment slips for review.

---

## 4. What Has Been Completed

### Repository Phase Status

All planned Phases 1–7 are implemented in the current repository state.

| Phase   | Summary                                                                                  |
| ------- | ---------------------------------------------------------------------------------------- |
| Phase 1 | Project foundation, runtime envelope, baseline middleware                                |
| Phase 2 | Auth, sessions, customer account, addresses                                              |
| Phase 3 | Catalog, storefront, admin CRUD                                                          |
| Phase 4 | Cart, buy-now, checkout, stock validation                                                |
| Phase 5 | Payments, orders, PromptPay QR, slip upload, order tracking                              |
| Phase 6 | Backoffice, reports, analytics, privileged user management                               |
| Phase 7 | Migrations, hardening, testing expansion, audit logging, CI, Docker/deployment readiness |

### Important Completed Fixes

These matter for future work:

- Prisma migration workflow replaced `db push` as the primary schema deployment path
- Tailwind/PostCSS was fixed for Angular by using `.postcssrc.json`
- MySQL adapter auth issue was fixed by enabling `allowPublicKeyRetrieval: true` in the Prisma MariaDB adapter configuration
- Angular template normalization is complete (components now use `templateUrl`)
- Frontend redesign slices 0–5 are complete

---

## 5. Frontend Redesign Status

A full frontend redesign was completed after Phase 7 using a **Clean Pro** design direction:

- Slate-based neutral surfaces
- Indigo accent
- Stronger card surfaces, spacing, and hierarchy
- Shared UI primitives for consistent status, alerts, tables, empty states, and dialogs

### Redesign Slices Completed

| Slice   | Description                                     |
| ------- | ----------------------------------------------- |
| Slice 0 | Visual foundation, layout shells, global styles |
| Slice 1 | Shared UI components                            |
| Slice 2 | Auth pages + storefront catalog pages           |
| Slice 3 | Cart + checkout + order confirmation            |
| Slice 4 | Customer account pages                          |
| Slice 5 | Backoffice pages                                |

### Pages Redesigned

**Customer-facing:** home, login, register, product list, product detail, cart, checkout, order confirmation, order history, order detail, address list, address form

**Backoffice:** dashboard, analytics, daily sales, orders list/detail, products list/form, categories list/form, brands list/form, users list/form

### TypeScript Safety Note

Unsafe non-null assertions and unsafe escape-hatch patterns were removed from touched frontend application files. Guarded boundary casts such as `Record<string, unknown>` may still exist where external data is narrowed safely.

---

## 6. Backend / Infrastructure / Production-Readiness Status

### Database and Prisma

- Prisma v7 with MySQL 8
- Migration-based workflow is in place
- `apps/api/prisma/migrations/` contains committed migrations
- An `AuditLog` model was added
- Production path uses `prisma migrate deploy`

### Security Hardening Completed

- Route-specific rate limiting on sensitive paths
- Production CORS wildcard guard
- JWT env validation
- Audit logging for privileged state-changing actions
- Expanded backend tests

### Deployment Direction

The preferred production deployment targets are **Vercel** (frontend) and **Railway** (API + MySQL). The codebase is platform-agnostic — the API reads environment variables directly and the Angular build uses a relative `/api/v1` path that works with Vercel rewrites.

A Docker Compose production stack exists in `docker/docker-compose.production.yml` as an optional self-hosted fallback. Dockerfiles and nginx config are in `docker/`. Docker is **not** the primary deployment path.

### CI

GitHub Actions workflow exists at `.github/workflows/ci.yml`. It runs build/lint/tests for both API and web and uses a MySQL service container for API tests.

---

## 7. Testing / Build / Lint / Docker / CI Status

At the last verified state:

|       | Web                     | API                     |
| ----- | ----------------------- | ----------------------- |
| Build | ✅ passing              | ✅ passing              |
| Lint  | ✅ passing              | ✅ passing              |
| Tests | ✅ 27 files / 110 tests | ✅ 23 files / 303 tests |

CI workflow exists and runs both app pipelines in GitHub Actions. A Docker Compose production stack is available in `docker/` as an optional self-hosted fallback but is not the primary deployment path.

### Verification Commands

```bash
# API
cd apps/api
npm run build
npm run lint
npm test

# Web
cd apps/web
npm run build
npm run lint
npm test
```

If root workspace scripts exist, verify them in the root `package.json` before relying on them.

---

## 8. Important Implementation Decisions and Constraints

1. **Repository state is authoritative** — If this handoff and the code disagree, trust the code.
2. **No backend feature expansion during redesign** — The frontend redesign was completed without changing backend behavior.
3. **Avoid `any`, non-null assertions, and unsafe assertions** — Guarded narrowing is acceptable where external input must be interpreted safely.
4. **Angular signals are the preferred local state model** — Use signals/computed for component state; RxJS remains appropriate for HTTP flows.
5. **Zod validates all external boundaries** — Do not bypass existing validation patterns.
6. **Thin controllers, service-heavy backend** — Keep business rules in services.
7. **Tailwind v4 is configured via Angular-compatible PostCSS** — Do not reintroduce `postcss.config.js` in a way Angular ignores.
8. **MySQL adapter configuration is intentional** — The Prisma MariaDB adapter uses `allowPublicKeyRetrieval: true` to avoid the MySQL 8 auth failure seen earlier.

---

## 9. Known Issues / Risks / Things to Verify

1. **No end-to-end test suite yet** — Unit/integration coverage is strong, but there is no Playwright/Cypress layer.
2. **No localization/i18n framework** — The app is English-first despite targeting Thai-market commerce patterns.
3. **No email workflows** — No order-confirmation emails, password reset emails, or notification system.
4. **No real-time updates** — Order and payment status changes require refresh/navigation, not push updates.
5. **Cloudinary credentials are required for upload flows** — Image upload and payment slip upload require valid config.
6. **Rate limiting is not comprehensive across every route** — Sensitive routes are covered, but not every endpoint.
7. **Always verify before continuing work:**

```bash
git status
git log --oneline --decorate -5
cd apps/api && npm test
cd ../web && npm test
```

---

## 10. Recommended Next Steps in Priority Order

1. **E2E coverage** — Add Playwright or Cypress for key user flows (auth, checkout, slip upload, backoffice approval)
2. **Operational polish** — Improve production logging/observability; document deployment/rollback more explicitly
3. **Email / notification workflows** — Order confirmation, payment review outcome, password reset
4. **Internationalization** — Thai localization support, localized strings and date formatting
5. **Search and performance enhancements** — Better search UX, lazy media optimizations, larger-data rendering improvements
6. **Accessibility pass** — Keyboard flows, ARIA validation, contrast/focus audits

---

## 11. Key Files and Directories to Inspect First

### Project Rules and Docs

- `CLAUDE.md`
- `docs/`
- `README.md`
- `HANDOFF_FOR_ANTIGRAVITY.md`

### Backend

- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `apps/api/src/config/`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/`
- `apps/api/src/modules/`

### Frontend

- `apps/web/src/app/app.routes.ts`
- `apps/web/src/styles.css`
- `apps/web/src/app/layouts/`
- `apps/web/src/app/shared/components/`
- `apps/web/src/app/features/`

### Infra

- `docker/docker-compose.production.yml` (optional self-hosted)
- `.github/workflows/ci.yml`

---

## 12. Exact Commands to Run

### Local Development

```bash
# From repo root
npm install

# Start local MySQL if needed
docker compose up -d mysql

# Apply DB migrations
cd apps/api
npx prisma migrate deploy

# Run API
npm run dev
```

In another terminal:

```bash
cd apps/web
npm start
```

### Local Verification

```bash
# API
cd apps/api
npm run build && npm run lint && npm test

# Web
cd apps/web
npm run build && npm run lint && npm test
```

### Docker Self-Hosted Verification (optional)

```bash
docker compose -f docker/docker-compose.production.yml down -v
docker compose -f docker/docker-compose.production.yml build --no-cache
docker compose -f docker/docker-compose.production.yml up
```

Runtime checks:

```bash
curl http://localhost:3000/api/v1/health
```

Verify the nginx-served frontend at: `http://localhost`

---

## 13. Git State / Branch / Recent Meaningful Commits

At handoff time, the meaningful recent history was:

| Commit    | Message                                                       |
| --------- | ------------------------------------------------------------- |
| `aa05105` | `feat: redesign storefront, account, and backoffice frontend` |
| `407cdce` | `refactor: extract angular templates into html files`         |
| `1d7d888` | `fix: restore Tailwind build and MySQL adapter connectivity`  |
| `dc82487` | `fix: production docker and tailwind build issues`            |

Before continuing work, verify current git state directly:

```bash
git status
git branch
git log --oneline --decorate -10
```

Do not assume the branch, HEAD, or remote sync state still matches this document without checking first.
