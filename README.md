# PC Hub

E-commerce web application for selling computer hardware. Built with Angular, Express.js, MySQL, and Prisma.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21, Tailwind CSS v4, TypeScript |
| Backend | Express.js 5, TypeScript |
| Database | MySQL 8.0 |
| ORM | Prisma ORM v7 |
| Image Storage | Cloudinary |
| Auth | JWT (access + refresh tokens) |

## Prerequisites

- Node.js 24+
- Docker and Docker Compose (for MySQL or full-stack deployment)
- npm

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd pc-hub

# Install API dependencies
npm --prefix apps/api install

# Install Web dependencies
npm --prefix apps/web install
```

### 2. Start MySQL

```bash
docker compose up -d mysql
```

This starts MySQL 8.0 with a `pc_hub_dev` database and a `pc_hub_test` database (via `docker/mysql/init.sql`).

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. At minimum, set strong JWT secrets (32+ characters).

### 4. Run database migrations

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
```

### 5. Seed sample data (optional)

```bash
cd apps/api
npm run db:seed
```

Seeds 3 users, 6 categories, 6 brands, and 12 products. See [Seed Data](#seed-data) for details.

### 6. Start development servers

```bash
# From project root — run in separate terminals
npm run dev:api    # API on http://localhost:3000
npm run dev:web    # Web on http://localhost:4200
```

The web dev server proxies `/api` requests to the API server automatically.

## Project Structure

```
pc-hub/
├── apps/
│   ├── api/              # Express.js backend
│   │   ├── prisma/       # Schema, migrations, seed
│   │   ├── src/          # Application source
│   │   └── tests/        # API integration tests
│   └── web/              # Angular frontend
│       └── src/          # Application source
├── docker/
│   ├── mysql/            # MySQL init scripts
│   └── nginx/            # nginx config for production
├── docs/                 # Project documentation
├── docker-compose.yml          # Development (MySQL only)
└── docker-compose.production.yml  # Full-stack production
```

## Available Scripts

### Root

| Script | Description |
|--------|-------------|
| `npm run dev:api` | Start API dev server with hot reload |
| `npm run dev:web` | Start Angular dev server |
| `npm run build:all` | Build both API and Web |
| `npm run lint:all` | Lint both API and Web |
| `npm run test:all` | Run all tests |

### API (`apps/api`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run tests (Vitest) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed sample data |

### Web (`apps/web`)

| Script | Description |
|--------|-------------|
| `npm start` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint via Angular CLI |
| `npm test` | Run tests (Vitest via Angular CLI) |

## Database

### Migrations

The project uses Prisma's migration-based workflow:

- **Development:** `npx prisma migrate dev` — creates and applies migrations
- **Production/CI:** `npx prisma migrate deploy` — applies existing migrations only

### Seed Data

The seed script (`apps/api/prisma/seed.ts`) creates:

| Entity | Count | Details |
|--------|-------|---------|
| Users | 3 | admin@pchub.com / staff@pchub.com / customer@pchub.com |
| Categories | 6 | CPU, GPU, RAM, Motherboard, Storage, PSU |
| Brands | 6 | AMD, Intel, NVIDIA, Corsair, Samsung, Seasonic |
| Products | 12 | 2 per category with realistic specs and prices |

Default passwords: `Admin@1234`, `Staff@1234`, `Customer@1234`

The seed is idempotent — safe to run multiple times.

## Docker Production Deployment

### Build and start all services

```bash
# Configure production environment
cp .env.example .env
# Edit .env with production values (strong secrets, real Cloudinary keys, etc.)

# Build and start
docker compose -f docker-compose.production.yml up -d --build
```

### Services

| Service | Description | Port |
|---------|-------------|------|
| `mysql` | MySQL 8.0 database | Internal only |
| `migrate` | Runs Prisma migrations then exits | — |
| `api` | Express.js API server | Internal (3000) |
| `web` | nginx serving Angular + API proxy | 80 |

### How it works

1. `mysql` starts and passes health check
2. `migrate` runs `prisma migrate deploy` against the database, then exits
3. `api` starts after migrations complete
4. `web` serves the Angular app and proxies `/api/` to the API container

### Seed in production

```bash
docker compose -f docker-compose.production.yml run --rm api \
  npx tsx prisma/seed.ts
```

## Environment Variables

### API

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | MySQL connection string (`mysql://user:pass@host:3306/db`) |
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `CORS_ORIGIN` | Yes | — | Allowed CORS origin (must not be `*` in production) |
| `JWT_ACCESS_SECRET` | Yes | — | Access token signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | — | Refresh token signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | No | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_DAYS` | No | `7` | Refresh token expiry in days |
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API secret |
| `PROMPTPAY_ID` | No | — | PromptPay ID for QR generation |

### Docker Compose production

| Variable | Description |
|----------|-------------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MYSQL_USER` | MySQL application user |
| `MYSQL_PASSWORD` | MySQL application password |
| `MYSQL_DATABASE` | MySQL database name |

## Testing

```bash
# API tests (Vitest + Supertest)
cd apps/api && npm test

# Web tests (Vitest via Angular CLI)
cd apps/web && npx ng test --watch=false
```

Tests require a running MySQL instance. The API test suite uses `NODE_ENV=test` which disables rate limiting.

## CI

GitHub Actions runs on push to `main` and on pull requests. Two parallel jobs:

- **API:** lint, typecheck, build, and test against MySQL 8.0
- **Web:** lint, build, and test

See `.github/workflows/ci.yml`.

## Documentation

Detailed project documentation is available in the `docs/` directory:

- `PRD.md` — Product requirements
- `ARCHITECTURE.md` — System architecture
- `DB_SCHEMA.md` — Database schema
- `API_SPEC.md` — API specification
- `SECURITY.md` — Security practices
- `TESTING.md` — Testing strategy
- `PHASES.md` — Implementation phases
