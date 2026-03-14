# Phase 3 Plan

## Overview

Phase 3 is split into three slices to keep scope controlled and reduce implementation risk:

| Slice | Description |
|-------|-------------|
| **Phase 3A** | Database schema + backend public catalog APIs |
| **Phase 3B** | Backoffice catalog management for admin/staff |
| **Phase 3C** | Frontend storefront catalog browsing |

### Recommended Execution Order

```
Phase 3A → Phase 3B → Phase 3C
```

- **Phase 3B** depends on the catalog schema created in 3A
- **Phase 3C** depends on the public catalog APIs created in 3A
- 3B and 3C do not depend on each other directly, but backend-first is preferred

---

### Current Status Before Phase 3

**Completed:**
- Phase 1: project foundation, tooling, env validation, security middleware, health/readiness, lint/build/test
- Phase 2: authentication, session management, role middleware, customer address management
- Phase 3A: public catalog schema and APIs are completed

**Remaining in Phase 3:**
- Phase 3B
- Phase 3C

---

## Phase 3A: Database Schema + Backend Public Catalog APIs

### Goal

Build the catalog data model and public read-only catalog APIs for categories, brands, and products.

---

### Scope

#### Database Models

Add these Prisma models:

- `Category`
- `Brand`
- `Product`
- `ProductImage`

---

#### Database Details

##### Category

| Field | Type |
|-------|------|
| `id` | — |
| `name` | — |
| `slug` | unique |
| `description` | — |
| `parentId` | nullable self-reference |
| `isActive` | — |
| `createdAt` | — |
| `updatedAt` | — |

##### Brand

| Field | Type |
|-------|------|
| `id` | — |
| `name` | — |
| `slug` | unique |
| `logoUrl` | nullable |
| `logoPublicId` | nullable |
| `isActive` | — |
| `createdAt` | — |
| `updatedAt` | — |

##### Product

| Field | Type |
|-------|------|
| `id` | — |
| `categoryId` | — |
| `brandId` | — |
| `name` | — |
| `slug` | unique |
| `sku` | unique |
| `description` | — |
| `price` | Decimal |
| `stock` | — |
| `warrantyMonths` | nullable |
| `isActive` | — |
| `createdAt` | — |
| `updatedAt` | — |

##### ProductImage

| Field | Type |
|-------|------|
| `id` | — |
| `productId` | — |
| `imageUrl` | — |
| `imagePublicId` | — |
| `altText` | nullable |
| `sortOrder` | — |
| `createdAt` | — |

---

#### Required Indexes

**Category**
- unique `slug`
- index `parentId`
- index `isActive`

**Brand**
- unique `slug`
- index `isActive`

**Product**
- unique `slug`
- unique `sku`
- index `categoryId`
- index `brandId`
- index `isActive`
- index `createdAt`

**ProductImage**
- index `productId`
- composite index `productId + sortOrder`

---

#### Relations

- `Category` self-reference: parent / children
- `Category` 1:N `Product`
- `Brand` 1:N `Product`
- `Product` 1:N `ProductImage`

---

### Backend Modules

#### Categories

**Files:**
- `modules/categories/category.schema.ts`
- `modules/categories/category.service.ts`
- `modules/categories/category.controller.ts`
- `modules/categories/category.routes.ts`

**Routes:**
```
GET /api/v1/categories
GET /api/v1/categories/:categoryId
```

#### Brands

**Files:**
- `modules/brands/brand.schema.ts`
- `modules/brands/brand.service.ts`
- `modules/brands/brand.controller.ts`
- `modules/brands/brand.routes.ts`

**Routes:**
```
GET /api/v1/brands
GET /api/v1/brands/:brandId
```

#### Products

**Files:**
- `modules/products/product.schema.ts`
- `modules/products/product.service.ts`
- `modules/products/product.controller.ts`
- `modules/products/product.routes.ts`

**Routes:**
```
GET /api/v1/products
GET /api/v1/products/:productId
GET /api/v1/products/slug/:slug
```

#### Shared Utilities

**Create:** `common/pagination.ts`

**Responsibilities:**
- Reusable Zod pagination schema
- Pagination metadata builder
- `sendPaginatedSuccess()` helper

---

### Validation Rules

#### Common Pagination

| Field | Rule |
|-------|------|
| `page` | coerce to int, min 1, default 1 |
| `limit` | coerce to int, min 1, max 100, default 20 |

#### Shared Search/Filter

| Field | Rule |
|-------|------|
| `search` | optional string, max 200 |
| `categoryId` | optional coerce to int, positive |
| `brandId` | optional coerce to int, positive |
| `minPrice` | optional coerce to number, min 0 |
| `maxPrice` | optional coerce to number, min 0 |
| `sort` | enum: `price_asc`, `price_desc`, `newest`, `oldest`, `name_asc`, `name_desc` |

#### Params

Route params use Zod and must coerce to positive integers where applicable.

---

### Authorization Rules

All Phase 3A routes are **public**.

**Public behavior:**
- Only return records where `isActive = true`
- Inactive categories, brands, and products must be hidden
- Detail endpoints must return `404` for nonexistent or inactive records

---

### Response Behavior

#### List Endpoints

Return paginated responses:

```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Detail Endpoints

```json
{
  "success": true,
  "message": "...",
  "data": {...}
}
```

#### Product List Item Shape

Include:
- `id`, `name`, `slug`, `sku`, `price`, `stock`, `warrantyMonths`
- Category summary
- Brand summary
- First image URL or `null`

#### Product Detail Shape

Include:
- Full product fields
- `category`
- `brand`
- Full `images` array ordered by `sortOrder`

#### Decimal Handling

- Do **not** expose raw Prisma `Decimal` objects in API responses
- Map `price` to a plain number in explicit mapper functions
- Do **not** use unsafe type assertions

---

### Test Scope

#### `category.test.ts`
- Empty list returns empty array
- Only active categories returned
- Search works
- Pagination works
- Detail by id works
- Nonexistent id returns 404
- Inactive id returns 404

#### `brand.test.ts`
- Empty list returns empty array
- Only active brands returned
- Search works if implemented
- Pagination works
- Detail by id works
- Nonexistent/inactive returns 404

#### `product.test.ts`
- Empty list returns empty array
- Active products returned with category/brand/first image
- Detail by id works
- Detail by slug works
- Nonexistent/inactive returns 404
- Filters work for `categoryId`
- Filters work for `brandId`
- Filters work for price range
- Search works
- Sorting works
- Pagination works

#### Test Data Strategy

- Seed directly via Prisma in tests
- Do not depend on backoffice routes in Phase 3A tests
- Avoid parent/child category relationships in tests unless needed

---

### Risks and Edge Cases

- Slug uniqueness
- Decimal response mapping
- Self-referencing category structure
- Empty catalog behavior
- N+1 queries in product list
- Page beyond total should return empty data, not 404

---

## Phase 3B: Backoffice Catalog Management

### Goal

Build privileged catalog management for staff and admins, including CRUD, active/inactive toggle, and product image upload/delete.

---

### Scope

#### Backoffice Route Design

All routes mounted under: `/api/v1/backoffice`

**Middleware:**
- `requireAuth` at backoffice router level
- `requireRole(...)` at route level

---

#### Backoffice Category Routes

| Method | Route | Role |
|--------|-------|------|
| `GET` | `/api/v1/backoffice/categories` | STAFF, ADMIN |
| `POST` | `/api/v1/backoffice/categories` | ADMIN |
| `PATCH` | `/api/v1/backoffice/categories/:categoryId` | ADMIN |
| `DELETE` | `/api/v1/backoffice/categories/:categoryId` | ADMIN |
| `POST` | `/api/v1/backoffice/categories/:categoryId/toggle-active` | STAFF, ADMIN |

#### Backoffice Brand Routes

| Method | Route | Role |
|--------|-------|------|
| `GET` | `/api/v1/backoffice/brands` | STAFF, ADMIN |
| `POST` | `/api/v1/backoffice/brands` | ADMIN |
| `PATCH` | `/api/v1/backoffice/brands/:brandId` | ADMIN |
| `DELETE` | `/api/v1/backoffice/brands/:brandId` | ADMIN |
| `POST` | `/api/v1/backoffice/brands/:brandId/toggle-active` | STAFF, ADMIN |

#### Backoffice Product Routes

| Method | Route | Role |
|--------|-------|------|
| `GET` | `/api/v1/backoffice/products` | STAFF, ADMIN |
| `POST` | `/api/v1/backoffice/products` | ADMIN |
| `PATCH` | `/api/v1/backoffice/products/:productId` | ADMIN |
| `DELETE` | `/api/v1/backoffice/products/:productId` | ADMIN |
| `POST` | `/api/v1/backoffice/products/:productId/toggle-active` | STAFF, ADMIN |
| `POST` | `/api/v1/backoffice/products/:productId/images` | ADMIN |
| `DELETE` | `/api/v1/backoffice/products/:productId/images/:imageId` | ADMIN |

---

### Backend Modules

#### Backoffice Categories

**Files:**
- `modules/backoffice/categories/category.schema.ts`
- `modules/backoffice/categories/category.service.ts`
- `modules/backoffice/categories/category.controller.ts`
- `modules/backoffice/categories/category.routes.ts`

#### Backoffice Brands

**Files:**
- `modules/backoffice/brands/brand.schema.ts`
- `modules/backoffice/brands/brand.service.ts`
- `modules/backoffice/brands/brand.controller.ts`
- `modules/backoffice/brands/brand.routes.ts`

#### Backoffice Products

**Files:**
- `modules/backoffice/products/product.schema.ts`
- `modules/backoffice/products/product.service.ts`
- `modules/backoffice/products/product.controller.ts`
- `modules/backoffice/products/product.routes.ts`

#### Shared Backoffice Router

**Create:** `routes/backoffice.routes.ts`

**Responsibilities:**
- Apply `requireAuth` once
- Mount category, brand, and product backoffice routes

---

### Validation Rules

#### Category Create/Update

| Field | Rule |
|-------|------|
| `name` | string, min 1, max 100 |
| `slug` | string, min 1, max 100, slug regex |
| `description` | optional string, max 1000 |
| `parentId` | optional positive int, must reference an existing category |
| `isActive` | optional boolean |

#### Brand Create/Update

| Field | Rule |
|-------|------|
| `name` | string, min 1, max 100 |
| `slug` | string, min 1, max 100, slug regex |
| `isActive` | optional boolean |

#### Product Create/Update

| Field | Rule |
|-------|------|
| `categoryId` | positive int, must reference an existing category |
| `brandId` | positive int, must reference an existing brand |
| `name` | string, min 1, max 255 |
| `slug` | string, slug regex |
| `sku` | string, min 1, max 50 |
| `description` | string, max 5000 |
| `price` | positive number |
| `stock` | integer, min 0 |
| `warrantyMonths` | optional integer, min 0 |
| `isActive` | optional boolean |

#### Product Image Upload

- `multipart/form-data`, single file field
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
- Max size: **5MB**
- `altText`: optional string, max 255
- `sortOrder`: optional integer, min 0

---

### Authorization Rules

| Action | Role |
|--------|------|
| Create category/brand/product | ADMIN only |
| Update category/brand/product | ADMIN only |
| Delete category/brand/product | ADMIN only |
| Upload product image | ADMIN only |
| Delete product image | ADMIN only |
| List all (incl. inactive) | STAFF or ADMIN |
| Toggle active/inactive | STAFF or ADMIN |
| Any backoffice access | ❌ CUSTOMER |

#### Status Code Rules

| Code | Reason |
|------|--------|
| `401` | Unauthenticated access to protected routes |
| `403` | Role-based forbidden access |
| `404` | Referenced resources that do not exist |
| `400` | Malformed payloads only |

---

### Cloudinary Integration

#### Dependencies

- `cloudinary`
- `multer`
- `@types/multer`

#### Config Files

- `src/config/cloudinary.ts`
- `src/config/upload.ts`

#### Environment Variables

```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

> **Important:** Do not silently treat empty strings as a valid long-term configuration strategy. Image upload/delete routes must fail clearly and safely if Cloudinary is not configured. Tests may mock Cloudinary and must not require real credentials.

#### Upload Flow

1. `multer` parses multipart request using memory storage
2. Validate file presence and metadata
3. Upload buffer to Cloudinary
4. Create `ProductImage` DB record **only after** successful upload
5. If upload fails → return safe error, do **not** create DB record

#### Delete Flow

1. Load `ProductImage`
2. Verify it belongs to the target product
3. Attempt Cloudinary delete
4. Delete DB record
5. If Cloudinary delete fails → handle safely and explicitly

#### Multer Rules

- Use memory storage with 5MB size limit and MIME validation in `fileFilter`
- Invalid MIME → `400`
- Oversized file → `400`
- No file → `400`

---

### Uniqueness Handling

Use Prisma unique constraints for: category slug, brand slug, product slug, product sku.

**Behavior:**
- Catch Prisma unique constraint errors
- Return `409 CONFLICT`
- Use clear messages indicating which unique field conflicted

---

### Delete Constraints

**Category delete** — Reject with `409` if:
- Products reference the category
- Child categories reference the category

**Brand delete** — Reject with `409` if:
- Products reference the brand

**Product delete** — Current phase behavior:
- Product can be deleted
- Associated product images must be handled explicitly
- Design should remain extensible for future order checks in Phase 5

---

### Toggle Behavior

**Endpoint:** `POST /:id/toggle-active`

**Behavior:**
- Load entity by id
- `404` if not found
- Flip `isActive`
- Return updated id and state
- **No cascade:** toggling category/brand inactive does not auto-toggle products

---

### Response Behavior

| Action | Response |
|--------|----------|
| Create/Update | `success`, `message`, `data` |
| Delete | `success`, `message` |
| Toggle | `success`, `message`, `data` (`id` + `isActive`) |

Backoffice list endpoints use paginated response shape consistent with Phase 3A, but **include inactive records** as allowed by role.

---

### Test Scope

#### `backoffice-category.test.ts`
- Admin create
- Duplicate slug → 409
- Admin update
- Admin delete when no references
- Delete blocked by products → 409
- Delete blocked by children → 409
- Staff toggle → 200
- Staff create/delete → 403
- Customer access → 403
- Unauthenticated → 401
- List includes inactive records

#### `backoffice-brand.test.ts`
- Same pattern as category, minus child checks

#### `backoffice-product.test.ts`
- Admin create
- Nonexistent `categoryId` → 404
- Nonexistent `brandId` → 404
- Duplicate slug → 409
- Duplicate sku → 409
- Admin update
- Admin delete
- Staff toggle → 200
- Staff cannot create/update/delete → 403
- Invalid price/stock validation

#### `backoffice-product-image.test.ts`
- Mock Cloudinary
- Valid upload → 201
- Invalid MIME → 400
- Too large → 400
- Delete image → 200
- Delete image from wrong product → 404
- `altText` and `sortOrder` stored correctly

#### Auth Setup for Tests

1. Register users via auth API
2. Promote users to STAFF/ADMIN via Prisma in test setup
3. Login to obtain tokens

---

### Risks and Edge Cases

- Slug uniqueness race conditions
- Delete with references
- Circular category parenting on writes
- Cloudinary failure
- Orphaned images if external storage and DB operations diverge
- MIME spoofing / upload validation gaps

---

## Phase 3C: Frontend Storefront Catalog Browsing

### Goal

Build the public storefront catalog UI using the APIs from Phase 3A.

---

### Scope

#### Shared Models

- `shared/models/category.model.ts`
- `shared/models/brand.model.ts`
- `shared/models/product.model.ts`
- `shared/models/pagination.model.ts`

#### Core Service

**Create:** `core/services/catalog.service.ts`

**Responsibilities:**
- Fetch categories
- Fetch brands
- Fetch product list with filters
- Fetch product detail by id
- Fetch product detail by slug

---

### Feature Pages

#### Product List

**Route:** `/products`

**Component:** `features/catalog/product-list/product-list.ts`

**Responsibilities:**
- Render product grid
- Search
- Category filter
- Brand filter
- Price range filter
- Sort dropdown
- Pagination
- Empty state

#### Product Detail

**Route:** `/products/:slug`

**Component:** `features/catalog/product-detail/product-detail.ts`

**Responsibilities:**
- Render full product info
- Render image gallery
- Show specs
- Show disabled or hidden add-to-cart button until Phase 4

#### Category-Based Browsing

**Route:** `/categories/:slug`

**Behavior:** Reuse product list with preset category filter

#### Brand-Based Browsing

**Route:** `/brands/:slug`

**Behavior:** Reuse product list with preset brand filter

---

### Shared UI Components

- `shared/components/product-card/product-card.ts`
- `shared/components/pagination/pagination.ts`

#### Layout Updates

Update storefront navigation:
- Add **Products** link
- Optional category dropdown later

---

### Validation Rules (Frontend)

| Field | Rule |
|-------|------|
| `search` | Trimmed, max 200 |
| `minPrice` | Non-negative |
| `maxPrice` | Non-negative, ≥ `minPrice` |
| `page`, `limit` | Positive integers |

---

### Authorization Rules

All Phase 3C routes are **public**.

> **UI note:** Add-to-cart is not active yet — cart belongs to Phase 4.

---

### Test Scope

#### `product-list.spec.ts`
- Renders products
- Handles empty state
- Handles pagination navigation

#### `product-detail.spec.ts`
- Renders product info
- Handles 404
- Handles image gallery

#### `product-card.spec.ts`
- Renders image, name, price

#### `catalog.service.spec.ts`
- Builds correct query params
- Handles API responses safely

---

### UX and Edge Cases

- Image-less products need placeholders
- Long names should truncate in cards
- Prices should use **Thai Baht** formatting
- Empty catalog should show friendly empty state
- Deep links with query params should restore filters
- Slug-based detail pages should show `404` state when missing

---

## Notes

### Phase 3B and Phase 3C Independence

After Phase 3A, both 3B and 3C can technically proceed independently. Preferred order remains:

```
Phase 3A → Phase 3B → Phase 3C
```

---

### Type Safety Rules

Across **all** Phase 3 work:

- ❌ No `any`
- ❌ No `unknown` escape hatches
- ❌ No unsafe type assertions
- ✅ Use Zod parsing, explicit mappers, typed helpers, and safe narrowing