# PC Hub Project Instructions

Read this file and all documents in `./docs` before planning or coding.

## Required project docs
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DB_SCHEMA.md
- docs/API_SPEC.md
- docs/SECURITY.md
- docs/TESTING.md
- docs/PHASES.md

## Project goal
Build a real-world, production-ready medium-to-large e-commerce web application for selling computer hardware.

## Tech stack
- Frontend: Angular 21 + Tailwind CSS v4
- Backend: Express.js 5 + TypeScript
- Database: MySQL
- ORM: Prisma ORM v7
- Image storage: Cloudinary
- Auth tokens: jsonwebtoken
- Password hashing: bcryptjs

## Preferred repository structure
Use this structure unless there is a strong production-grade reason not to:

/
  apps/
    web/
    api/
  docs/
  docker/
  README.md
  CLAUDE.md

## Non-negotiable rules
- Entire project must use TypeScript.
- Never use `any`.
- Never use `unknown` as an escape hatch.
- Never use unsafe type assertions.
- Validate all external input with Zod.
- Validate environment variables with Zod.
- Keep controllers thin.
- Put business logic in services/use-cases.
- Follow OWASP-aware security practices.
- Keep the repository runnable after each phase.
- Run build, lint, and relevant tests after meaningful changes.
- If official framework or library behavior is uncertain, check official docs first and do not guess.
- Do not silently change architecture.
- Do not implement unrelated features.
- Do not leave placeholder fake implementations presented as complete.

## Working style
- Explore first, then plan, then implement.
- For large changes, always propose phases first.
- Work phase by phase.
- Keep completed work and pending work clearly separated.
- Prefer maintainability and security over shortcuts.
- Do not widen scope unless required by the docs.

## Product scope summary
- Roles: customer, staff, admin
- Customer: register, login, browse products, cart, buy now, checkout, address management, order tracking
- Payment methods: COD and PromptPay QR
- PromptPay QR requires payment slip upload for review
- Staff: review orders, approve/reject payment-related workflows, view daily sales, export Excel/PDF, toggle active/inactive states
- Admin: full access, CRUD catalog, manage privileged users, access deep analytics

## Code quality expectations
- Use clean modular architecture.
- Use Angular standalone components.
- Use lazy-loaded routes where appropriate.
- Prefer explicit types and safe narrowing.
- Avoid dead code and duplicated logic.
- Write clear English comments only when helpful.
- Keep responses concise but technically complete.

## Definition of done
A task is not done unless:
- Build passes
- Lint passes
- Relevant tests pass
- The changed area is runnable
- The implementation matches project docs
- No major security or typing shortcuts were introduced