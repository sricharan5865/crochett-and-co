# Execution Plan — Crochett & Co Admin Portal

This execution plan coordinates the parallel tracks: E2E Testing Track and the Implementation Track.

## Step-by-Step Execution Plan

### Step 1: E2E Test Suite Creation (Parallel Track)
- **Agent**: `teamwork_preview_orchestrator` (as E2E Testing Orchestrator)
- **Working Directory**: `.agents/e2e_testing_orch/`
- **Goal**: Read the `ORIGINAL_REQUEST.md`, design a comprehensive opaque-box E2E test suite with Tiers 1-4, implement the test harness/runner, and write the test cases.
- **Output**: `TEST_INFRA.md`, E2E test suite code, and `TEST_READY.md`.

### Step 2: Implementation Track - Milestone M2 (Database Layer & Fallback)
- **Agent**: `teamwork_preview_orchestrator` (as Sub-orchestrator)
- **Working Directory**: `.agents/sub_orch_db/`
- **Goal**: Implement `src/lib/db.ts` to support dual-mode (Firebase / JSON file fallback) and set up the local fallback files using the static database arrays.
- **Output**: Verified `src/lib/db.ts`, fallback JSON files.

### Step 3: Implementation Track - Milestone M3 (Admin Authentication & Management)
- **Agent**: `teamwork_preview_orchestrator` (as Sub-orchestrator)
- **Working Directory**: `.agents/sub_orch_auth/`
- **Goal**: Set up `/admin/login`, cookie/session authentication, and password change capability. Use password: `adminpassword123` as default.
- **Output**: Login screen, cookie session, password update utility.

### Step 4: Implementation Track - Milestone M4 (Product CRUD)
- **Agent**: `teamwork_preview_orchestrator` (as Sub-orchestrator)
- **Working Directory**: `.agents/sub_orch_crud/`
- **Goal**: Build the admin product list dashboard page (`/admin` or `/admin/dashboard`) allowing full CRUD (Add, Edit, Delete) for products.
- **Output**: CRUD interface for product management.

### Step 5: Implementation Track - Milestone M5 (Storefront Integration)
- **Agent**: `teamwork_preview_orchestrator` (as Sub-orchestrator)
- **Working Directory**: `.agents/sub_orch_store/`
- **Goal**: Hook up public-facing pages (home, shop, categories, wishlist, cart, product details) to dynamically fetch data from the data access layer.
- **Output**: Storefront displaying live data, reflecting edits instantly.

### Step 6: Integration and Phase 1 & 2 Verification
- **Agent**: `teamwork_preview_orchestrator` (as Sub-orchestrator)
- **Working Directory**: `.agents/sub_orch_verify/`
- **Goal**:
  1. Phase 1: Wait for `TEST_READY.md`, run E2E test suite (Tiers 1-4), fix bugs until all pass.
  2. Phase 2: Run Challenger-led white-box Tier 5 testing for coverage hardening.
- **Output**: Verified clean build and E2E test runs.

## Governance & Safety Gating
- Every milestone sub-orchestrator must follow the iteration loop: Explorer → Worker → Reviewer → gate.
- The Forensic Auditor must run and verify there are no integrity violations.
- Succession protocol: self-succeed after 16 spawns.
