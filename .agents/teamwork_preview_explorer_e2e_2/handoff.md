# Handoff Report — E2E Testing Feasibility & Specification

## 1. Observation
We inspected the codebase and directly observed the following files and structural patterns:
* **Package Scripts (`package.json`)**: No testing library or test scripts exist in the original package.json:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
  ```
* **Client-Side Stores (`src/lib/store/cart-store.ts` & `wishlist-store.ts`)**:
  * Utilize `zustand` with the `persist` middleware.
  * Define storage names: `name: "crochett-cart"` and `name: "crochett-wishlist"`.
* **Storefront Interactive Features**:
  * **Product Card (`src/components/products/product-card.tsx`)**: Has aria-labels: `"Add ${product.name} to cart"`, `"Add to wishlist"` / `"Remove from wishlist"`, and `"Inquire on WhatsApp"`.
  * **Product Detail (`src/components/products/product-detail.tsx`)**: Displays custom description accordions and handles color choices with `aria-label="Select ${color}"`.
  * **Build Your Bouquet (`src/app/build-your-bouquet/page.tsx`)**: Saves design state to local storage under key `"crochett-bouquet-design"`.
  * **Custom Orders (`src/app/custom-orders/page.tsx`)**: A 10-step wizard with fields like `"Full Name *"`, `"Phone Number *"` (validates 10 digits), delivery date picker (sets `min` date to current date + 7 days), and pincode (validates 6 digits).

## 2. Logic Chain
1. Spawning the Next.js dev server programmatically using `child_process.spawn('npm run dev')` creates a running server instance on a local port.
2. A port loop check using `node:net` connects to port 3000 to cleanly wait for the dev server to start before running tests.
3. Native Node.js `fetch` downloads server-rendered HTML from the server endpoints, allowing validation of page-load statuses (200 OK or 404 Not Found), SEO metadata, layout structures, and statically rendered text.
4. Because native `fetch` does not execute client-side JavaScript, client-side interactions (like button clicks, Zustand store changes, local storage persist hooks) cannot be tested interactively in pure Node.js.
5. However, we can test Zustand state changes programmatically in pure Node.js as unit/integration tests by mocking browser globals (`window` and `localStorage`) before importing/invoking store modules.
6. We mapped out exactly how pages render product data and the specific strings and HTML attributes they contain.
7. From this, we created 25 Tier 1 happy-path test cases (SSR-based and Crawler-based) and 25 Tier 2 edge cases (SSR status edge cases, validation limits, Zustand state mocks).
8. Thus, a Node-only E2E and integration testing harness is feasible for verifying initial render output, static data, link crawling, and client-side store logic, though it cannot test interactive UI updates natively without a browser runner.

## 3. Caveats
* **No Interactivity Testing**: Client-side interactive DOM state updates (e.g. clicking "Add to Cart" and visually watching the header count badge increment) cannot be simulated because Node.js lacks a browser rendering engine and layout system (no Puppeteer/Playwright or jsdom included).
* **Network Mode Constraints**: All network calls in E2E tests must target `localhost`. External links (such as actual redirects to `wa.me`) must be checked for URL correctness without dispatching the actual HTTP request.
* **Store Global Mocking**: Running Zustand stores under Node requires global mocks for `window` and `localStorage` to avoid initialization errors.

## 4. Conclusion
Using native Node.js features to run E2E integration tests is feasible for validating SSR HTML structures, SEO tags, link crawlers, and store states. A native harness can start/stop the dev server, crawl local links, check metadata, and run isolated store tests. It is highly recommended to combine SSR HTML verification with programmatic Zustand unit testing.

## 5. Verification Method
To verify this analysis:
1. Inspect the detailed report written to `c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\teamwork_preview_explorer_e2e_2\analysis.md`.
2. Inspect the test specs to confirm that they match the page paths, components, and selectors defined in `src/app` and `src/components`.
3. Check the proposed `tests/e2e/run.mjs` setup design to ensure that all process controls are native and cross-platform compatible.
