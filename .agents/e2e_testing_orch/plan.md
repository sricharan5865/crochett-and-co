# E2E Test Suite Design Plan

This document outlines the architecture, feature list, and test cases for the opaque-box E2E testing suite.

## Test Infrastructure Architecture
- **Language**: Node.js
- **Test Harness**: Custom Node.js runner that spins up/down the Next.js dev server, executes tests, keeps track of assertions, and generates reports.
- **HTTP client**: Native `fetch` (Node.js 18+).
- **Test execution files**:
  - `e2e-tests/runner.js`: Main execution script.
  - `e2e-tests/helpers.js`: Helper utilities for Auth login/logout, CRUD requests, HTML parsing, database state reset.
  - `e2e-tests/suites/tier1_feature.js`: Tier 1 Feature Coverage.
  - `e2e-tests/suites/tier2_boundary.js`: Tier 2 Boundary & Corner Cases.
  - `e2e-tests/suites/tier3_cross.js`: Tier 3 Cross-Feature Combinations.
  - `e2e-tests/suites/tier4_realworld.js`: Tier 4 Real-World Application Scenarios.

---

## Features under Test
1. **Admin Authentication**: Secure login/logout at `/admin` (or `/api/auth/login`).
2. **Admin Password Management**: Password updating at `/admin/dashboard` (or `/api/auth/change-password`).
3. **Product Creation & Listing**: Product creation (CRUD - Create) and dashboard list retrieval.
4. **Product Updating**: Product editing (CRUD - Update) and updating stock status.
5. **Product Deletion**: Product removal (CRUD - Delete).

---

## Test Cases

### Tier 1: Feature Coverage (>=5 tests per feature)
- **1. Admin Authentication**
  - T1.1: Login with correct default credentials succeeds.
  - T1.2: Login with incorrect credentials fails.
  - T1.3: Accessing dashboard without session returns 401/403 or login redirect.
  - T1.4: Accessing dashboard with valid session succeeds (200).
  - T1.5: Logout invalidates session and dashboard access is blocked again.
- **2. Password Management**
  - T2.1: Changing password succeeds.
  - T2.2: Old password fails to authenticate post-change.
  - T2.3: New password successfully authenticates post-change.
  - T2.4: Attempting password change unauthenticated fails.
  - T2.5: Restoring default password works for idempotency.
- **3. Product Creation**
  - T3.1: Create product with standard fields succeeds.
  - T3.2: Verify created product is listed in admin dashboard.
  - T3.3: Verify created product appears in public `/shop` catalog.
  - T3.4: Verify created product details page `/shop/[slug]` loads and shows correct fields.
  - T3.5: Verify created product appears in its category `/categories/[slug]`.
- **4. Product Updating**
  - T4.1: Edit product name, description, price, category, tags.
  - T4.2: Verify edits appear in dashboard product list.
  - T4.3: Verify edits appear on public `/shop`.
  - T4.4: Verify edits appear on `/shop/[slug]`.
  - T4.5: Update product `inStock` to false, verify storefront shows out-of-stock badge.
- **5. Product Deletion**
  - T5.1: Delete a product.
  - T5.2: Verify product is removed from dashboard list.
  - T5.3: Verify product detail page `/shop/[slug]` returns 404/not found.
  - T5.4: Verify product is removed from `/shop`.
  - T5.5: Verify product is removed from `/categories/[slug]`.

### Tier 2: Boundary & Corner Cases (>=5 tests per feature)
- **1. Admin Authentication**
  - T2.1.1: Login with empty password.
  - T2.1.2: Login with extremely long password.
  - T2.1.3: Login with potential injection payload (SQL/NoSQL or HTML script tags).
  - T2.1.4: Session request with malformed or tampered cookie.
  - T2.1.5: Concurrent authentication attempts on same session.
- **2. Password Management**
  - T2.2.1: Change password to empty string (should fail/reject).
  - T2.2.2: Change password to a very short string (should fail/reject).
  - T2.2.3: Change password to a very long string.
  - T2.2.4: Change password with special characters, spaces, and emojis.
  - T2.2.5: Change password with incorrect session/credentials.
- **3. Product Creation**
  - T2.3.1: Create product with duplicate slug.
  - T2.3.2: Create product with negative price.
  - T2.3.3: Create product with extremely long text fields.
  - T2.3.4: Create product with HTML/Script tags in fields (XSS protection).
  - T2.3.5: Create product with missing required fields (empty name/slug).
- **4. Product Updating**
  - T2.4.1: Update product with negative price.
  - T2.4.2: Update product with empty name / missing required fields.
  - T2.4.3: Update non-existent product ID.
  - T2.4.4: Update product slug to conflict with another product's slug.
  - T2.4.5: Update product fields with special characters/HTML injection.
- **5. Product Deletion**
  - T2.5.1: Delete non-existent product.
  - T2.5.2: Delete product already deleted.
  - T2.5.3: Delete product with malformed ID format.
  - T2.5.4: Delete product without auth credentials.
  - T2.5.5: Delete product and check cart/wishlist gracefully handles it.

### Tier 3: Cross-Feature Combinations (pairwise coverage)
- **T3.1: Full Auth + CRUD Lifecycle**: Login -> Create -> Update -> Logout -> Verify Public -> Login -> Delete.
- **T3.2: Auth Change Flow**: Login -> Change Password -> Logout -> Login old (fails) -> Login new (passes) -> Restore default password.
- **T3.3: Persistence / Reload simulation**: Create product -> Simulate server restart or reload data -> Verify product storefront persistence.
- **T3.4: Storefront Cart Price Update**: Create product -> Add to Cart -> Change product price in admin -> Verify cart page reflects updated price.
- **T3.5: Storefront Cart Deletion**: Create product -> Add to Cart -> Delete product in admin -> Verify cart page handles deleted product.

### Tier 4: Real-World Application Scenarios (>=5 scenarios)
- **T4.1: Catalog Setup & Launch**: Complete admin & customer journey.
- **T4.2: Sale/Discount Campaign**: Set original prices, tag "sale", verify public sale badges.
- **T4.3: Inventory Stock-out Flow**: Mark product out-of-stock, check storefront disabled actions, verify cart warnings.
- **T4.4: Customizable Product Ordering**: Create custom product, verify detail page has customization CTA and generates correct WhatsApp link.
- **T4.5: Graceful Database Fallback**: Simulate Firebase failure, verify storefront loads local JSON static data.
