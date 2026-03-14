# Phase 3 Plan

## Overview

Phase 3 is split into three slices to keep scope controlled, reduce implementation risk, and make debugging easier:

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
- 3B and 3C do not directly depend on each other, but backend-first is preferred

---

### Current Status

**Completed:**
- Phase 1: project foundation, tooling, env validation, security middleware, health/readiness endpoints, lint/build/test
- Phase 2: authentication, session management, role middleware, customer address management
- Phase 3A: public catalog schema and APIs
- Phase 3B: backoffice catalog management for admin/staff

**Next:**
- Phase 3C: frontend storefront catalog browsing

---

## Phase 3A: Database Schema + Backend Public Catalog APIs

### Goal

Build the catalog data model and public read-only catalog APIs for categories, brands, and products.

---

### Scope

#### Database Models

Add these Prisma models: `Category`, `Brand`, `Product`, `ProductImage`

---

#### Database Details

##### Category

| Field | Notes |
|-------|-------|
| `id` | — |
| `name` | — |
| `slug` | unique |
| `description` | — |
| `parentId` | nullable self-reference |
| `isActive` | — |
| `createdAt` | — |
| `updatedAt` | — |

##### Brand

| Field | Notes |
|-------|-------|
| `id` | — |
| `name` | — |
| `slug` | unique |
| `logoUrl` | nullable |
| `logoPublicId` | nullable |
| `isActive` | — |
| `createdAt` | — |
| `updatedAt` | — |

##### Product

| Field | Notes |
|-------|-------|
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

| Field | Notes |
|-------|-------|
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

> Route params use Zod and must coerce to positive integers where applicable.

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
  "data": { ... }
}
```

#### Product List Item Shape

Includes: `id`, `name`, `slug`, `sku`, `price`, `stock`, `warrantyMonths`, category summary, brand summary, first image URL or `null`

#### Product Detail Shape

Includes: full product fields, `category`, `brand`, full `images` array ordered by `sortOrder`

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
- Filters work for `categoryId`, `brandId`, price range
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
| Upload/delete product image | ADMIN only |
| List all records (incl. inactive) | STAFF or ADMIN |
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

**Important rules:**
- Do not rely on empty-string defaults as a long-term configuration strategy
- The app may still start without Cloudinary config so non-image features and tests can run
- Image upload/delete routes must fail clearly and safely if Cloudinary is not configured
- Tests may mock Cloudinary and must not require real credentials

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

- Memory storage, 5MB size limit, MIME validation in `fileFilter`
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

**Product delete:**
- Product can be deleted; associated product images must be handled explicitly
- Design should remain extensible for future order checks in Phase 5

---

### Toggle Behavior

**Endpoint:** `POST /:id/toggle-active`

**Behavior:**
- Load entity by id → `404` if not found
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

Backoffice list endpoints use the same paginated shape as Phase 3A, but **include inactive records** as allowed by role.

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
- Admin update and delete
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
- Fetch product detail by slug
- List enough categories and brands for filter dropdowns and slug resolution

---

### Feature Pages

#### Product List

**Route:** `/products`  
**Component:** `features/catalog/product-list/product-list.ts`

**Responsibilities:**
- Render product grid
- Search, category filter, brand filter, price range filter
- Sort dropdown, pagination, empty state

#### Product Detail

**Route:** `/products/:slug`  
**Component:** `features/catalog/product-detail/product-detail.ts`

**Responsibilities:**
- Render full product info and image gallery
- Show specs
- Show disabled or hidden add-to-cart button until Phase 4

#### Category-Based Browsing

**Route:** `/categories/:slug`  
**Behavior:** Reuse product list with preset category filter resolved from slug

#### Brand-Based Browsing

**Route:** `/brands/:slug`  
**Behavior:** Reuse product list with preset brand filter resolved from slug

---

### Shared UI Components

- `shared/components/product-card/product-card.ts`
- `shared/components/pagination/pagination.ts`

#### Shared Pipe

**Create:** `shared/pipes/thai-baht.pipe.ts`

| Property | Value |
|----------|-------|
| Class name | `ThaiBahtPipe` |
| Pipe name | `thaiBaht` |

#### Layout Updates

Update storefront navigation: add **Products** link

---

### Query Param Strategy

The product list page uses **URL query params as the single source of truth**.

**Supported query params:** `search`, `categoryId`, `brandId`, `minPrice`, `maxPrice`, `sort`, `page`

**Rules:**
- Do **not** blindly use `queryParamsHandling: 'merge'`
- Build the next query param object explicitly
- Drop empty/default values from the URL
- Reset `page` to 1 when search/filter/sort changes
- Update only `page` when the user paginates

---

### API Integration

Use only the existing public Phase 3A APIs:

```
GET /categories
GET /brands
GET /products
GET /products/slug/:slug
```

#### Slug to ID Resolution

No backend slug route is added for categories or brands in Phase 3C.

**Frontend strategy:**
- Fetch categories and brands using public list endpoints with `limit=100`
- Resolve `/categories/:slug` and `/brands/:slug` by exact slug match in the fetched list
- If the slug is not found, show an appropriate not-found state

> This is acceptable because category and brand datasets are expected to remain small in this product scope.

---

### State Handling

| State | Behavior |
|-------|----------|
| Loading | Show loading UI while requests are pending |
| Empty | Show friendly empty state with a clear-filters action |
| Error | Show inline error state with retry action; use safe error extraction helpers |
| 404 | Product detail by missing slug → not-found state; missing category/brand slug → not-found state |

---

### Image Placeholder Behavior

- Products without images must show a placeholder image
- Keep placeholder asset local, e.g. `public/images/no-image.svg`
- Product list uses the summary image if present, otherwise placeholder
- Product detail uses the full image array if present, otherwise placeholder

---

### Thai Baht Price Formatting

Use `ThaiBahtPipe` for display.

**Rules:**
- Input is a plain number from the API
- Use Thai Baht currency formatting consistently
- Do **not** do ad-hoc inline formatting in templates

---

### Test Scope

#### `catalog.service.spec.ts`
- Builds correct query params
- Handles successful responses
- Handles error responses safely

#### `product-card.spec.ts`
- Renders name, price, brand, image
- Renders placeholder when no image is present
- Links to correct slug route

#### `product-list.spec.ts`
- Renders products
- Handles loading, empty, and pagination state

#### `product-detail.spec.ts`
- Renders product data
- Handles not-found state
- Handles image gallery

#### `thai-baht.pipe.spec.ts`
- Formats integer and decimal values correctly

---

### Type Safety Rules

Across Phase 3C:
- ❌ No `any`
- ❌ No `unknown` escape hatches
- ❌ No unsafe type assertions
- ✅ Use explicit interfaces for API response shapes
- ✅ Use typed services and typed component inputs
- ✅ Keep templates strictly typed

---

## Notes

### Phase 3B and 3C Independence

After Phase 3A, both 3B and 3C can proceed independently. Preferred order remains:

```
Phase 3A → Phase 3B → Phase 3C
```

### Implementation Style

- Keep components reusable and minimal
- Keep frontend state local and URL-driven where possible
- Do not start cart behavior in this phase
- Add-to-cart remains disabled or hidden until Phase 4