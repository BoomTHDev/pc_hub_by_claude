I now have the full picture. Here is the refined Phase 3 plan.

---

## Phase 3A: Database Schema + Backend Public Catalog APIs

### Prisma models/enums to add

**Models:**
- `Category` — id, name, slug (unique), description, parentId (nullable self-ref), isActive, createdAt, updatedAt
- `Brand` — id, name, slug (unique), logoUrl (nullable), logoPublicId (nullable), isActive, createdAt, updatedAt
- `Product` — id, categoryId (FK), brandId (FK), name, slug (unique), sku (unique), description, price (Decimal), stock (Int), warrantyMonths (Int, nullable), isActive, createdAt, updatedAt
- `ProductImage` — id, productId (FK), imageUrl, imagePublicId, altText (nullable), sortOrder (Int), createdAt

**No new enums needed** — UserRole already exists; PaymentMethod/OrderStatus are Phase 5 concerns.

**Indexes (per DB_SCHEMA.md):**
- Category: unique slug, index parentId, index isActive
- Brand: unique slug, index isActive
- Product: unique slug, unique sku, index categoryId, index brandId, index isActive, index createdAt
- ProductImage: index productId, composite index productId+sortOrder

**Relations:**
- Category self-ref (parent/children)
- Category 1:N Product
- Brand 1:N Product
- Product 1:N ProductImage

### Backend modules and routes

**Module: `modules/categories/`**
- `category.schema.ts` — Zod schemas for query params (pagination, search)
- `category.service.ts` — list active categories (with optional parent filtering), get by id
- `category.controller.ts` — thin handlers
- `category.routes.ts` — public routes

**Routes:**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/categories` | Public | List active categories, paginated, searchable |
| GET | `/api/v1/categories/:categoryId` | Public | Single active category detail |

**Module: `modules/brands/`**
- Same pattern as categories

**Routes:**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/brands` | Public | List active brands |
| GET | `/api/v1/brands/:brandId` | Public | Single active brand detail |

**Module: `modules/products/`**

**Routes:**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/products` | Public | Paginated, filtered, sorted |
| GET | `/api/v1/products/:productId` | Public | Detail with images, category, brand |
| GET | `/api/v1/products/slug/:slug` | Public | Slug-based lookup for SEO URLs |

**Shared: `common/pagination.ts`**
- Reusable Zod schema for `page`, `limit` query params
- Reusable `sendPaginatedSuccess()` helper matching the API_SPEC paginated response shape (`{ success, data, pagination: { page, limit, total, totalPages } }`)

### Validation rules

- `page`: coerce to int, min 1, default 1
- `limit`: coerce to int, min 1, max 100, default 20
- `search`: optional string, max 200
- `categoryId`/`brandId` filter: optional coerce to int, positive
- `minPrice`/`maxPrice`: optional coerce to number, non-negative
- `sort`: optional enum (`price_asc`, `price_desc`, `newest`, `oldest`, `name_asc`, `name_desc`)
- Param IDs: coerce to int, positive (reusable pattern already in `addressIdParamSchema`)

### Authorization rules

- All routes in this slice are **public** — no auth required
- Public endpoints only return `isActive: true` records
- Inactive categories/brands/products are hidden from public API entirely

### Test scope

- `tests/category.test.ts` — list categories (empty, with data), search, pagination, detail by id, 404 for nonexistent, 404 for inactive
- `tests/brand.test.ts` — same pattern
- `tests/product.test.ts` — list with pagination, filter by category/brand/price range, search by name, sort, detail by id, detail by slug, 404 for nonexistent, 404 for inactive, includes images/category/brand in detail response

Seed test data directly via Prisma in `beforeAll` — no API dependency on Phase 3B admin routes.

### Dependencies needed

- `@prisma/client` — already installed (just run migration after schema update)
- No new npm packages

### Risks and edge cases

- **Slug uniqueness**: slugs must be unique per model; migration could fail if existing data violates constraints (no data exists yet, so low risk now, but admin CRUD must enforce this)
- **Decimal price**: MySQL `DECIMAL` via Prisma — verify Prisma returns `Decimal` type, which needs `.toNumber()` or serialization in responses; use Prisma's `Decimal` type consistently
- **Self-referencing Category**: parentId self-ref requires care — ensure no circular references (Phase 3B concern for CRUD, but schema must support it now)
- **Empty catalog**: public APIs should return empty arrays, not errors, when no data exists
- **Product list N+1**: eager-load category, brand, and first image in list queries to avoid N+1
- **Pagination edge cases**: page beyond total should return empty data with correct pagination metadata, not 404

---

## Phase 3B: Back Office Catalog Management (Admin/Staff)

### Prisma models/enums to add

None — all models added in 3A. May need to add Cloudinary env vars to `env.ts` schema for image upload.

### Backend modules and routes

**Module: `modules/backoffice/categories/`**

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/backoffice/categories` | Admin | Create category |
| PATCH | `/api/v1/backoffice/categories/:categoryId` | Admin | Update category |
| DELETE | `/api/v1/backoffice/categories/:categoryId` | Admin | Delete if no products reference it |
| POST | `/api/v1/backoffice/categories/:categoryId/toggle-active` | Staff | Toggle isActive |

**Module: `modules/backoffice/brands/`**

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/backoffice/brands` | Admin | Create brand |
| PATCH | `/api/v1/backoffice/brands/:brandId` | Admin | Update brand |
| DELETE | `/api/v1/backoffice/brands/:brandId` | Admin | Delete if no products reference it |
| POST | `/api/v1/backoffice/brands/:brandId/toggle-active` | Staff | Toggle isActive |

**Module: `modules/backoffice/products/`**

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/backoffice/products` | Admin | Create product |
| PATCH | `/api/v1/backoffice/products/:productId` | Admin | Update product |
| DELETE | `/api/v1/backoffice/products/:productId` | Admin | Delete if not in any order (future-safe: soft-delete or reject) |
| POST | `/api/v1/backoffice/products/:productId/toggle-active` | Staff | Toggle isActive |
| POST | `/api/v1/backoffice/products/:productId/images` | Admin | Upload image via Cloudinary |
| DELETE | `/api/v1/backoffice/products/:productId/images/:imageId` | Admin | Delete image from Cloudinary + DB |

**Backoffice catalog list views** (staff/admin need to see inactive items too):
- The existing public GET routes from 3A only return active items. Backoffice needs its own list endpoints OR the public endpoints accept `isActive` filter when caller is staff/admin. Decision: add separate backoffice list routes to keep public routes simple.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/backoffice/categories` | Staff | List all categories (active + inactive) |
| GET | `/api/v1/backoffice/brands` | Staff | List all brands |
| GET | `/api/v1/backoffice/products` | Staff | List all products with filters |

### Validation rules

**Category create/update:**
- name: string, min 1, max 100, required on create
- slug: string, min 1, max 100, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, required on create
- description: string, max 1000, optional
- parentId: coerce to int, positive, optional (must reference existing category)
- isActive: boolean, optional (defaults true on create)

**Brand create/update:**
- name: string, min 1, max 100
- slug: same pattern as category
- logoUrl/logoPublicId: handled via separate upload, not body fields
- isActive: boolean, optional

**Product create/update:**
- categoryId: coerce to int, positive, required on create (must exist)
- brandId: coerce to int, positive, required on create (must exist)
- name: string, min 1, max 255
- slug: same pattern
- sku: string, min 1, max 50
- description: string, max 5000
- price: coerce to number, positive (> 0)
- stock: coerce to int, min 0
- warrantyMonths: coerce to int, min 0, optional
- isActive: boolean, optional

**Image upload:**
- multipart/form-data, single file field
- Allowed MIME: image/jpeg, image/png, image/webp
- Max size: 5MB
- altText: optional string, max 255
- sortOrder: coerce to int, min 0, default 0

### Authorization rules

- **Admin only**: create, update, delete categories/brands/products, upload/delete images
- **Staff or Admin**: toggle active state, list all (including inactive)
- Staff cannot create, edit, or delete catalog entities — only toggle visibility
- Use `requireRole('ADMIN')` for CRUD, `requireRole('STAFF', 'ADMIN')` for toggle/list

### Test scope

- `tests/backoffice-category.test.ts` — admin creates, updates, deletes, staff toggles, staff cannot create/delete (403), customer cannot access (403), slug uniqueness, delete with products (409)
- `tests/backoffice-brand.test.ts` — same pattern
- `tests/backoffice-product.test.ts` — admin CRUD, staff toggle, FK validation (nonexistent category/brand returns 400/404), slug/sku uniqueness, stock non-negative, price positive
- `tests/backoffice-product-image.test.ts` — upload (mock Cloudinary in test), delete, verify sortOrder, verify cleanup

Tests need admin + staff users. Create in `beforeAll` by registering then updating role via Prisma directly (no admin-create-user endpoint yet).

### Dependencies needed

- `cloudinary` — for image upload/delete
- `multer` — for multipart parsing (Express 5 compatible)
- `@types/multer` — types
- Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to env.ts Zod schema

### Risks and edge cases

- **Slug uniqueness race condition**: two concurrent creates with same slug — DB unique constraint handles it, service should catch Prisma unique constraint error and return 409
- **Delete with references**: deleting a category/brand that has products must fail with 409, not cascade
- **Delete product with future order items**: for now products have no orders (Phase 5), but design the delete check to be extensible — check `_count.orderItems` when OrderItem exists
- **Circular category parent**: parentId must not reference self or create a cycle — validate depth or at minimum reject self-reference
- **Cloudinary failure**: upload could fail mid-request — handle gracefully, don't create DB record if upload fails
- **Image orphans**: if DB write fails after Cloudinary upload, the image is orphaned — accept this risk for now, can add cleanup job later
- **File size/type bypass**: validate MIME type on server side, not just file extension

---

## Phase 3C: Frontend Storefront Catalog Browsing

### Prisma models/enums to add

None — frontend only.

### Backend modules and routes

None — uses public APIs from Phase 3A.

### Frontend pages/components

**Shared models:**
- `shared/models/category.model.ts` — Category interface
- `shared/models/brand.model.ts` — Brand interface
- `shared/models/product.model.ts` — Product, ProductImage interfaces
- `shared/models/pagination.model.ts` — PaginatedResponse, PaginationMeta interfaces

**Core services:**
- `core/services/catalog.service.ts` — categories(), brands(), products(filters), productDetail(id), productBySlug(slug)

**Feature pages:**

| Route | Component | Description |
|-------|-----------|-------------|
| `/products` | `features/catalog/product-list/product-list.ts` | Paginated grid with search bar, category/brand filters, price range, sort dropdown |
| `/products/:slug` | `features/catalog/product-detail/product-detail.ts` | Full product info, image gallery, specs, add-to-cart button (disabled until Phase 4) |
| `/categories/:slug` | (reuse product-list with preset filter) | Products filtered by category |
| `/brands/:slug` | (reuse product-list with preset filter) | Products filtered by brand |

**Shared components:**
- `shared/components/product-card/product-card.ts` — Thumbnail, name, price, brand badge (reused in grid)
- `shared/components/pagination/pagination.ts` — Page navigation controls

**Layout updates:**
- Storefront nav: add "Products" link, optional category dropdown later

### Validation rules

Frontend-side:
- Search input: trimmed, max 200 chars before sending
- Price filter: non-negative numbers, minPrice <= maxPrice
- Page/limit: positive integers

### Authorization rules

- All routes are **public** — no guards needed
- Add-to-cart button shown but disabled (or hidden) until Phase 4 implements cart

### Test scope

- `product-list.spec.ts` — renders product cards, handles empty state, pagination navigation
- `product-detail.spec.ts` — renders product info, image gallery, handles 404
- `product-card.spec.ts` — renders name, price, image
- `catalog.service.spec.ts` — constructs correct query params, handles API responses

### Dependencies needed

- No new npm packages (Angular HttpClient already available)

### Risks and edge cases

- **Image-less products**: product card and detail must handle products with zero images gracefully (placeholder image)
- **Long product names**: truncate in card, full display in detail
- **Price formatting**: use Thai Baht formatting consistently (`฿1,234.00`)
- **Empty catalog**: product list shows friendly empty state, not a blank page
- **Deep linking**: `/products?search=gpu&categoryId=3&sort=price_asc` must restore filters from query params on page load
- **Slug-based routes**: product detail fetches by slug, not ID — if slug not found, show 404 page

---

## Dependency order

```
Phase 3A → Phase 3B (needs schema from 3A)
Phase 3A → Phase 3C (needs public APIs from 3A)
Phase 3B has no dependency on 3C and vice versa — they can be done in either order after 3A.
```

Recommended sequence: **3A → 3B → 3C** (backend-first ensures frontend has real APIs to hit during development).