# E2E Testing Feasibility Analysis: Node.js Native Features for Next.js

This report analyzes the feasibility of utilizing Node.js native features (e.g. `node:test`, `node:assert`, `child_process`, `fetch`, `fs`) to construct an E2E and integration testing harness for the **Crochett & Co** Next.js storefront.

---

## 1. Feasibility Analysis of Node.js Native Features

Running E2E tests against a Next.js dev server using only standard Node.js APIs is highly feasible, but it presents specific constraints that dictate what can and cannot be verified.

### 1.1 Test Harness Architecture
To execute E2E integration tests natively, we can design an orchestrator script (e.g., `run-e2e.mjs`) that implements the following lifecycle:

1. **Server Spawning**: Start the Next.js dev server using `child_process.spawn`.
   * **Command**: `npx next dev` or `node node_modules/next/dist/bin/next dev`
   * **Windows Portability**: We run using `{ shell: true }` to execute on Windows (`cmd.exe` or `powershell.exe`).
2. **Health Checking (Wait-for-Server)**: Since standard `spawn` is asynchronous, the harness must wait until the Next.js server is ready before running tests. This can be achieved natively via two approaches:
   * **Stdout Polling**: Scanning child process `stdout` stream for the ready marker (e.g., `"Ready in"` or `"Local:"`).
   * **Port Polling**: A looping socket attempt using `node:net` to connect to `localhost:3000` every 500ms, with a 30-second timeout.
3. **Execution**: Run the native Node.js test runner using `node:test` via `run` programmatically, or spawn a child process calling `node --test`.
4. **Cleanup & Shutdown**: On test completion (success or failure), gracefully terminate the Next.js server.
   * **Windows Process Tree Issue**: Spawning commands in Windows via shell creates process wrappers. A simple `devServer.kill()` kills the shell wrapper but leaves Next.js running as an orphan on port 3000.
   * **Native Windows Solution**: Execute `taskkill /F /T /PID <pid>` inside a teardown hook, or spawn the node CLI binary directly without shell wrapping.

```javascript
// Conceptual Native Orchestrator
import { spawn } from 'node:child_process';
import { connect } from 'node:net';
import { run } from 'node:test';
import { glob } from 'node:fs/promises';

async function waitForServer(port = 3000, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const socket = connect(port, '127.0.0.1', () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', reject);
      });
      return; // Connection succeeded
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Server startup timed out');
}
```

### 1.2 Feasibility & Limits Matrix
Because we are restricted to standard Node.js APIs without external headless browsers (Playwright, Puppeteer, Selenium), the testing capabilities partition as follows:

| Test Capability | Feasibility | Technical Approach | Limitations |
| :--- | :--- | :--- | :--- |
| **Initial Page Load (SSR/RSC)** | **Fully Feasible** | Native `fetch('http://localhost:3000/...')` to retrieve initial HTML payload. | Returns the raw, un-hydrated HTML. |
| **Routing / Navigation Structure** | **Fully Feasible** | Fetch pages and analyze anchor tags (`<a href="...">`) using string searches or RegExp. | Checks structural links, but does not test client-side Next.js route transitions (`next/navigation`). |
| **Static Data & Price Formatting** | **Fully Feasible** | Substring checks on the raw HTML response body. | Assumes data is statically rendered on server. |
| **SEO Metadata & OpenGraph** | **Fully Feasible** | Regex match `<title>`, `<meta name="description">`, `<meta property="og:*">` tags. | None. |
| **Link Integrity (Broken Links)** | **Fully Feasible** | Link crawler parsing `href` properties and checking response codes. | Cannot crawl dynamic client-rendered links. |
| **Zustand Client State (Cart/Wishlist)** | **Indirectly Feasible** | Import Zustand store logic files into a simulated browser window environment (using Node globals mocking). | Cannot click elements in browser. We test the state management files as unit/integration logic in Node. |
| **Form Interactivity (Custom Orders)** | **Infeasible** | Cannot type into inputs or submit forms interactively. | We can only test that the inputs are present in SSR HTML and verify validation schemas in isolation. |
| **3D Rendering (Bouquet Canvas)** | **Infeasible** | Cannot test Three.js rendering output. | Limited to checking if canvas wrapper elements exist. |

### 1.3 How to Bypass Interactivity Constraints
To maximize test coverage under standard Node.js limits:
1. **Zustand Store Unit/Integration Tests in Node**:
   To test that adding an item to the cart works, we can mock `window.localStorage` globally in our test files before importing the Zustand stores:
   ```javascript
   // Mock browser globals for Zustand Persist
   globalThis.window = {};
   globalThis.localStorage = {
     _data: {},
     getItem(key) { return this._data[key] || null; },
     setItem(key, val) { this._data[key] = String(val); },
     removeItem(key) { delete this._data[key]; },
     clear() { this._data = {}; }
   };
   
   // Now import and test store directly in Node
   import { useCartStore } from './src/lib/store/cart-store.ts';
   ```
2. **Regex-Based SSR HTML Parsing**:
   Since we don't have a DOM parser like `jsdom`, we utilize regular expressions to extract attributes and verify structures:
   * **Link Extractor**: `/href=["']([^"']+)["']/g`
   * **Element Value Extractor**: e.g., `<h1[^>]*>([^<]+)<\/h1>`

---

## 2. Storefront Component Mapping & Matching Patterns

Below is the verified mapping of storefront pages, components, HTML elements, and match patterns that E2E integration tests can target during initial SSR:

### 2.1 Header Component (`src/components/layout/header.tsx`)
Rendered on all pages inside the root layout.
* **Logo Link**: `<a href="/"` containing text `Crochett & Co`.
* **Navigation Links**:
  * Home: `href="/"`
  * Shop: `href="/shop"`
  * Categories: `href="/categories"`
  * Build Your Bouquet: `href="/build-your-bouquet"`
  * Custom Orders: `href="/custom-orders"`
  * Gift Hampers: `href="/gift-hampers"`
  * Gallery: `href="/gallery"`
  * About: `href="/about"`
  * Contact: `href="/contact"`
* **Wishlist Counter Link**: `href="/wishlist"` containing `aria-label="Wishlist"`.
* **Cart Counter Link**: `href="/cart"` containing `aria-label="Cart"`.
* **Announcement Bar Text**: `"Free delivery on orders above ₹999 | Custom orders welcome!"`

### 2.2 Footer Component (`src/components/layout/footer.tsx`)
Rendered on all pages inside the root layout.
* **Social Media Links**:
  * Instagram: `href="https://www.instagram.com/crochett.and.co"`
  * WhatsApp contact: `href="https://wa.me/919XXXXXXXXX"`
* **Policy Links**:
  * Shipping Policy: `href="/shipping-policy"`
  * Returns Policy: `href="/returns-policy"`
  * Privacy Policy: `href="/privacy-policy"`
  * Terms & Conditions: `href="/terms"`
* **Business Info**:
  * Email: `hello@crochettandco.com`
  * Copyright: `© 2024 Crochett & Co`

### 2.3 Home Page (`src/app/page.tsx`)
* **Hero Heading**: `<h1>` containing `Handmade Gifts That` and `<span class="text-gradient">Never Fade</span>`.
* **Hero Subheading**: `<p>` containing `Custom Crochet Bouquets, Flowers & Personalized Gifts Made With Love.`.
* **Hero CTAs**:
  * Order on WhatsApp link with WhatsApp domain.
  * Start Custom Order button with `href="/custom-orders"`.
* **Featured Collection Carousel**: Section header `<h2>Featured Collection</h2>`.
* **Shop by Occasion**: Section header `<h2>Shop by Occasion</h2>`.
* **Custom Design CTA**: `<h2>Design Your Dream Gift</h2>`.

### 2.4 Shop Page (`src/app/shop/page.tsx`)
* **Hero Banner Title**: `<h1>Our Collection 🌸</h1>`
* **Filter Title**: `<h2>Filters</h2>`
* **Search Input**: `<input type="text" ... placeholder="Search products..." />`
* **Checkboxes for Categories & Occasions**: `<input type="checkbox"` matching values or indices.
* **Sort Dropdown**: `<select ... aria-label="Sort products">` containing `<option>` values: `newest`, `price-low`, `price-high`, `popular`, `rating`.
* **Product Card Content** (`src/components/products/product-card.tsx`):
  * Links containing `href="/shop/[slug]"`
  * Bestseller tag: `<span class="... bg-sunflower ...">⭐ Bestseller</span>`
  * Trending tag: `<span class="... bg-lavender ...">🔥 Trending</span>`
  * Discount badge: e.g. `[0-9]+% OFF`
  * Product Price: `₹[0-9,]+`
  * Actions Wrapper: Contains "Add to Cart" button (`aria-label="Add [product.name] to cart"`), Wishlist Toggle button (`aria-label="Add to wishlist"` / `"Remove from wishlist"`), and WhatsApp inquiry link (`aria-label="Inquire on WhatsApp"`).

### 2.5 Categories Pages (`src/app/categories/page.tsx` & `[slug]/page.tsx`)
* **Categories Landing Title**: `<h1>Shop by Category 🎀</h1>`
* **Category Listing Links**: Grid of links pointing to `href="/categories/[category-slug]"`.
* **Category Detail Title**: `<h1>[Category Name]</h1>`
* **Category Empty State**: On categories like `tulips` (which has 0 matches in products data because tulips are categorized under `crochet-flowers` / `crochet-bouquets`), verify it displays:
  * `<h3>Coming Soon!</h3>`
  * `<p>We're crafting beautiful tulips for you. Check back soon...</p>`
  * Link with `href="/shop"` and text `Browse All Products`.

### 2.6 Product Detail Page (`src/app/shop/[slug]/page.tsx`)
* **Breadcrumb Navigation**: `<nav ... aria-label="Breadcrumb">` containing links for `Home`, `Shop`, and Category name.
* **Title Header**: `<h1>[Product Name]</h1>`
* **Pricing Elements**: Main bold price (e.g., `₹1,499`) and strike-through original price if discounted.
* **Color Selection**: Buttons with `aria-label="Select [color]"` representing available swatches.
* **Quantity Controls**: "Decrease quantity" button (`aria-label="Decrease quantity"`), quantity count text, and "Increase quantity" button (`aria-label="Increase quantity"`).
* **CTA Buttons**:
  * "Add to Cart" button with text `Add to Cart — ₹[Price]`
  * "Customize This Design" link with `href="/custom-orders"`
  * "Order on WhatsApp" link with green background class `bg-green-600`
* **Tabs / Accordion Triggers** (`src/components/ui/accordion.tsx`):
  * "Description" (content includes description text and `This product is customizable!` if `product.customizable` is true)
  * "Care Instructions" (lists bullet points for cleaning/maintenance)
  * "Shipping Info" (specifies free shipping threshold over ₹999)

### 2.7 Cart Page (`src/app/cart/page.tsx`)
* **Empty Cart State (Initial SSR)**:
  * Text: `<h1>Your Cart is Empty</h1>`
  * Paragraph: `Looks like you haven't added any handcrafted goodies yet.`
  * Button link: `href="/shop"` with text "Browse Collection".
* **Populated Cart Elements (Mocked/Hydrated)**:
  * Title: `<h1>Your Cart 🛒</h1>`
  * Count Text: `[Number] items in your cart`
  * Subtotal & Total display with delivery fees (`₹49` or `Free ✨`).
  * WhatsApp order button: "Order on WhatsApp".

### 2.8 Wishlist Page (`src/app/wishlist/page.tsx`)
* **Empty Wishlist State (Initial SSR)**:
  * Title: `<h1>Your Wishlist is Empty</h1>`
  * Button link: `href="/shop"` with text "Discover Products".
* **Populated Wishlist Elements (Mocked/Hydrated)**:
  * Title: `<h1>Your Wishlist 💕</h1>`
  * Saved Count Text: `[Number] items saved`

### 2.9 Build Your Bouquet Page (`src/app/build-your-bouquet/page.tsx`)
* **Main Title**: `<h1>Build Your Own Bouquet <span class="... animate-bounce">💐</span></h1>`
* **Flower Stems Selection Cards**: Items with buttons like `aria-label="Add one Roses"`, `aria-label="Remove one Roses"`.
* **Wrapping Selection Radio Buttons**: Input radio buttons with value options: `standard`, `kraft`, `luxury`, `satin`.
* **Bouquet Price Summary**: Lists quantities, subtotal of stems, chosen wrapping price, and a WhatsApp checkout button.

### 2.10 Custom Orders Page (`src/app/custom-orders/page.tsx`)
* **Main Title**: `<h1>Custom Orders <span class="... animate-bounce">✨</span></h1>`
* **Progress Bar**: `Step [1-10] of 10`
* **Multi-Step Form Labels**: Inputs corresponding to active step (e.g. `Full Name`, `Phone Number`, product type buttons, color swatches).

---

## 3. Test Cases Specification

Here is a comprehensive breakdown of 25 Tier 1 feature coverage tests and 25 Tier 2 boundary cases. Each entry specifies its target, execution method (SSR Fetch, Link Crawler, or Mock Zustand Store Unit Test), and expected result validation strings.

### 3.1 Tier 1: Feature Coverage (25 Test Cases)

#### 1. Home Page Accessibility and Critical Text
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Ensure request succeeds and page outputs structural marketing texts.
* **Match Patterns**:
  * Title matching `<title>Crochett & Co — Handmade Crochet Gifts & Custom Bouquets<\/title>`
  * Hero text `<h1>` containing `Handmade Gifts That`
  * Subtitle containing `Custom Crochet Bouquets, Flowers & Personalized Gifts Made With Love`

#### 2. Announcement Bar Display
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Confirm that delivery and custom orders announcement bar is displayed.
* **Match Pattern**: `✨ Free delivery on orders above ₹999 | Custom orders welcome! ✨`

#### 3. Home Page Featured Collection Grid
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Verify featured collection section is present.
* **Match Patterns**:
  * Section title `Featured Collection`
  * Carousel description `Our most loved handmade crochet creations, picked just for you.`

#### 4. Header Navigation Links Presence
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Parse headers to ensure all primary nav links are present in static markup.
* **Match Patterns**:
  * `href="/"`
  * `href="/shop"`
  * `href="/categories"`
  * `href="/build-your-bouquet"`
  * `href="/custom-orders"`

#### 5. Footer Social and Policy Links Presence
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Ensure structural footer compliance.
* **Match Patterns**:
  * `href="https://www.instagram.com/crochett.and.co"`
  * `href="/shipping-policy"`
  * `href="/returns-policy"`
  * `href="/privacy-policy"`
  * `href="/terms"`

#### 6. Custom Orders Home Page CTA Link
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Check that CTA button links correctly to custom orders workflow.
* **Match Pattern**: `<a href="/custom-orders" ...>Start Custom Order</a>` (or matching class/wrapper link)

#### 7. Shop Page Initial Product Grid
* **Target URL**: `/shop`
* **Method**: SSR Fetch
* **Verification Detail**: Ensure shop shows title, filters sidebar, and lists products.
* **Match Patterns**:
  * Header `<h1>Our Collection 🌸</h1>`
  * Subheading matching `[0-9]+ handmade treasures waiting to be loved`
  * Sidebar container containing `<h2>Filters</h2>`

#### 8. Sort Dropdown Options
* **Target URL**: `/shop`
* **Method**: SSR Fetch
* **Verification Detail**: Verify sorting select contains appropriate values.
* **Match Patterns**:
  * Select tag with attribute `aria-label="Sort products"`
  * Option values: `value="newest"`, `value="price-low"`, `value="price-high"`, `value="popular"`, `value="rating"`

#### 9. Product Card Attributes (Bestseller)
* **Target URL**: `/shop`
* **Method**: SSR Fetch
* **Verification Detail**: Verify that bestselling products contain proper badges and action tags.
* **Match Patterns**:
  * Anchor link with `href="/shop/rose-bouquet-classic-red"`
  * Bestseller indicator: `⭐ Bestseller`
  * Add to Cart button matching: `aria-label="Add Rose Bouquet — Classic Red to cart"`

#### 10. Product Card Actions (WhatsApp & Wishlist)
* **Target URL**: `/shop`
* **Method**: SSR Fetch
* **Verification Detail**: Verify that card has inquiry option and wishlist action button.
* **Match Patterns**:
  * Wishlist action button: `aria-label="Add to wishlist"` or `aria-label="Remove from wishlist"`
  * WhatsApp link: `aria-label="Inquire on WhatsApp"` with `href` matching `https://wa.me/` or `https://api.whatsapp.com/`

#### 11. Categories Landing Page
* **Target URL**: `/categories`
* **Method**: SSR Fetch
* **Verification Detail**: Ensure categories are loaded with count labels.
* **Match Patterns**:
  * Title `<h1>Shop by Category 🎀</h1>`
  * Subheader `Find the perfect handmade crochet creation for every occasion`
  * Link references `href="/categories/crochet-bouquets"`, `href="/categories/crochet-flowers"`, etc.

#### 12. Category Detail Page Header and Breadcrumbs
* **Target URL**: `/categories/crochet-bouquets`
* **Method**: SSR Fetch
* **Verification Detail**: Verify category detail page correctly loads metadata and breadcrumbs.
* **Match Patterns**:
  * Breadcrumb container `aria-label="Breadcrumb"` containing link to `/categories`
  * Header `<h1>Crochet Bouquets</h1>`
  * Count label matching `[0-9]+ products`

#### 13. Empty Category "Coming Soon" State
* **Target URL**: `/categories/tulips`
* **Method**: SSR Fetch
* **Verification Detail**: Validate category pages displaying no matching products show a clean "coming soon" message.
* **Match Patterns**:
  * Header `<h3>Coming Soon!</h3>`
  * Subtext `We're crafting beautiful tulips for you.`
  * CTA `href="/shop"` with text `Browse All Products`

#### 14. Product Detail Base Page Load (No Discount)
* **Target URL**: `/shop/lavender-dreams-collection`
* **Method**: SSR Fetch
* **Verification Detail**: Verify page loads, displays main price without discount percentages.
* **Match Patterns**:
  * Title `<h1>Lavender Dreams Collection</h1>`
  * Price `₹999`
  * Save/Discount tags should be absent.

#### 15. Product Detail Page with Active Discount
* **Target URL**: `/shop/rose-bouquet-classic-red`
* **Method**: SSR Fetch
* **Verification Detail**: Confirm discount mathematical output shows original and current price.
* **Match Patterns**:
  * Original Price: `<span class="... line-through">₹1,999</span>`
  * Price: `<span class="... font-bold ...">₹1,499</span>`
  * Discount percentage tag: `25% OFF`
  * Savings tag: `Save 25%`

#### 16. Product Detail Customizable Badge and Info
* **Target URL**: `/shop/rose-bouquet-classic-red`
* **Method**: SSR Fetch
* **Verification Detail**: Check customized text is displayed in descriptions.
* **Match Pattern**: `✨ This product is customizable! Contact us for personalization options.`

#### 17. Product Detail Care Instructions Accordion
* **Target URL**: `/shop/rose-bouquet-classic-red`
* **Method**: SSR Fetch
* **Verification Detail**: Verify maintenance steps are rendered statically.
* **Match Patterns**:
  * Trigger: `Care Instructions`
  * Bullet items: `Gently dust with a soft brush`, `Avoid direct sunlight`, `Spot clean with mild soap`

#### 18. Product Detail Shipping Info Accordion
* **Target URL**: `/shop/rose-bouquet-classic-red`
* **Method**: SSR Fetch
* **Verification Detail**: Verify logistical terms are rendered.
* **Match Patterns**:
  * Trigger: `Shipping Info`
  * Bullet items: `Free shipping on orders above ₹999`, `Standard delivery: 5–7 business days`

#### 19. Product Detail Page Breadcrumbs
* **Target URL**: `/shop/rose-bouquet-classic-red`
* **Method**: SSR Fetch
* **Verification Detail**: Check correct routing hierarchy in breadcrumbs.
* **Match Patterns**:
  * Container `aria-label="Breadcrumb"`
  * Direct parents: `href="/"`, `href="/shop"`, `href="/categories/crochet-bouquets"`

#### 20. Empty Cart State
* **Target URL**: `/cart`
* **Method**: SSR Fetch
* **Verification Detail**: Initial state shows empty basket messages.
* **Match Patterns**:
  * Basket emoji: `🧺`
  * Title `<h1>Your Cart is Empty</h1>`
  * CTA `href="/shop"` with text `Browse Collection`

#### 21. Empty Wishlist State
* **Target URL**: `/wishlist`
* **Method**: SSR Fetch
* **Verification Detail**: Initial state shows empty saved message.
* **Match Patterns**:
  * Heart emoji: `💕`
  * Title `<h1>Your Wishlist is Empty</h1>`
  * CTA `href="/shop"` with text `Discover Products`

#### 22. Build Your Bouquet Interface Stems Grid
* **Target URL**: `/build-your-bouquet`
* **Method**: SSR Fetch
* **Verification Detail**: Verify bouquet builder items are present with prices.
* **Match Patterns**:
  * Title `<h1>Build Your Own Bouquet`
  * Stem labels: `Roses`, `Tulips`, `Sunflowers`, `Daisies`, `Lavender`
  * Prices: `₹80/stem`, `₹70/stem`, `₹90/stem`

#### 23. Custom Orders Step 1 Form Fields
* **Target URL**: `/custom-orders`
* **Method**: SSR Fetch
* **Verification Detail**: Confirm wizard starts on Step 1.
* **Match Patterns**:
  * Progress text `Step 1 of 10`
  * Labels: `Full Name *`, `Phone Number *`
  * Input placeholder: `Your name`, `98XXXXXXXX`

#### 24. Standard Link Crawling Test
* **Target URL**: `/`
* **Method**: Link Crawler
* **Verification Detail**: Parse initial HTML of the home page, resolve all internal paths, and check they return status 200.
* **Match Target**: All retrieved anchor tags mapping to `http://localhost:3000/shop`, `/categories`, etc.

#### 25. SEO & Metadata Consistency Check
* **Target URL**: `/shop/sunflower-sunshine-bouquet`
* **Method**: SSR Fetch
* **Verification Detail**: Confirm SEO structure is correct.
* **Match Patterns**:
  * `<title>Sunflower Sunshine Bouquet — Crochett & Co</title>`
  * `<meta name="description" content="8 vibrant handmade crochet sunflowers" />`
  * `<meta property="og:title" content="Sunflower Sunshine Bouquet — Crochett & Co" />`

---

### 3.2 Tier 2: Boundary & Edge Cases (25 Test Cases)

#### 26. Invalid Product Route Response
* **Target URL**: `/shop/non-existent-product-slug`
* **Method**: SSR Fetch
* **Verification Detail**: Confirm routing triggers 404 behavior.
* **Expected Result**: HTTP Response Status Code is `404` (NotFound page rendered).

#### 27. Invalid Category Route Response
* **Target URL**: `/categories/non-existent-category-slug`
* **Method**: SSR Fetch
* **Verification Detail**: Confirm invalid category requests render 404 page.
* **Expected Result**: HTTP Response Status Code is `404`.

#### 28. Zustand Store Unit Test: Add Single Item to Cart
* **Target Component**: `src/lib/store/cart-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Programmatically trigger `addItem`, verify item state array includes item.
* **Expected Result**: `cartStore.items` length is exactly `1` and item quantity is `1`.

#### 29. Zustand Store Unit Test: Add Duplicate Item (Quantity Increment)
* **Target Component**: `src/lib/store/cart-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Trigger `addItem` twice for the same product, verify store increments count instead of duplicate indexes.
* **Expected Result**: `cartStore.items` length is `1`, but `items[0].quantity` equals `2`.

#### 30. Zustand Store Unit Test: Remove Item
* **Target Component**: `src/lib/store/cart-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Add item, then call `removeItem`, check length reset.
* **Expected Result**: `cartStore.items` length is `0`.

#### 31. Zustand Store Unit Test: Prevent Quantity Underflow
* **Target Component**: `src/lib/store/cart-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Attempt updating quantity of item to `0` or negative values.
* **Expected Result**: `updateQuantity` ignores request; item quantity remains at `1`.

#### 32. Zustand Store Unit Test: Clear Cart
* **Target Component**: `src/lib/store/cart-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Add multiple products and execute `clearCart`.
* **Expected Result**: `cartStore.items` resets to empty array `[]`.

#### 33. Zustand Store Unit Test: Toggle Wishlist
* **Target Component**: `src/lib/store/wishlist-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Programmatically call `toggleItem('product-id')`. Verify it toggles item inclusion.
* **Expected Result**: First call adds `'product-id'` (array has length 1), second call removes it (array is empty).

#### 34. Zustand Store Unit Test: Wishlist Check State Helper
* **Target Component**: `src/lib/store/wishlist-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Call helper `isInWishlist` for present and absent IDs.
* **Expected Result**: Returns `true` for wishlisted products, `false` for non-wishlisted.

#### 35. Delivery Fee Boundary Case: Under Free Threshold (Subtotal < 999)
* **Target Component**: `src/app/cart/page.tsx` logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Set cart item values to total exactly `₹998`. Calculate delivery fee.
* **Expected Result**: Delivery fee is exactly `₹49`. Total is `₹1047`.

#### 36. Delivery Fee Boundary Case: Exactly at Free Threshold (Subtotal == 999)
* **Target Component**: `src/app/cart/page.tsx` logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Set cart item values to total exactly `₹999`. Calculate delivery fee.
* **Expected Result**: Delivery fee is `₹0` (Free delivery). Total is `₹999`.

#### 37. Delivery Fee Boundary Case: Over Free Threshold (Subtotal > 999)
* **Target Component**: `src/app/cart/page.tsx` logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Set cart item values to total exactly `₹1000`. Calculate delivery fee.
* **Expected Result**: Delivery fee is `₹0`. Total is `₹1000`.

#### 38. Build Your Bouquet Quantity Boundaries
* **Target Component**: `src/app/build-your-bouquet/page.tsx` state
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Call update quantity for a stem with negative delta when count is 0.
* **Expected Result**: Quantities record remains empty or does not record negative values.

#### 39. Custom Orders Phone Input Length Boundary
* **Target Component**: `src/app/custom-orders/page.tsx` validation logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Feed step validation with phone values: `98765`, `98765432101`, `1234567890`.
* **Expected Result**: Validation fails for all three inputs and populates error string `"Enter a valid 10-digit phone number"`.

#### 40. Custom Orders Delivery Date Boundary Limit (Under 7 Days)
* **Target Component**: `src/app/custom-orders/page.tsx` validation logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Set delivery date to exactly 6 days from current system date.
* **Expected Result**: Form validation fails for date or native input field restricts it via `min` date attribute.

#### 41. Custom Orders Delivery Date Boundary Limit (Exactly 7 Days)
* **Target Component**: `src/app/custom-orders/page.tsx` validation logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Set delivery date to exactly 7 days from current system date.
* **Expected Result**: Validation succeeds, form moves to next step.

#### 42. Custom Orders Pincode Length & Character Boundaries
* **Target Component**: `src/app/custom-orders/page.tsx` validation logic
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Validate pincode text values: `11000`, `1100012`, `11000A`.
* **Expected Result**: Validation fails on step 6 and flags pincode error.

#### 43. Custom Orders Step Increment Bound
* **Target Component**: `src/app/custom-orders/page.tsx` wizard
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Test stepping boundary from 0 to 11.
* **Expected Result**: Step cannot decrement below `0` or increment beyond the maximum success step index (`10`).

#### 44. Local Storage Store Persistence Key Match
* **Target Component**: `src/lib/store/cart-store.ts` & `wishlist-store.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Check that local storage keys are named correctly in persist settings.
* **Expected Result**: Persist names are exactly `crochett-cart` and `crochett-wishlist`.

#### 45. Build Your Bouquet State Preservation Key
* **Target Component**: `src/app/build-your-bouquet/page.tsx`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Inspect logic to verify local storage saving key.
* **Expected Result**: Storage key matches `crochett-bouquet-design`.

#### 46. Link Crawler External Link Excludes
* **Target Component**: Link Crawler script
* **Method**: Link Crawler
* **Verification Detail**: Verify crawler identifies and bypasses external target social and messaging links.
* **Expected Result**: Links starting with `https://wa.me`, `https://api.whatsapp.com`, `https://www.instagram.com` are marked as external and not crawled.

#### 47. Dev Server Response Time Benchmark
* **Target URL**: `/`
* **Method**: SSR Fetch
* **Verification Detail**: Measure the time elapsed from request initiation to response body completion.
* **Expected Result**: Latency is less than `200ms` under local dev server conditions.

#### 48. Content-Type Header Verification
* **Target URL**: `/shop`
* **Method**: SSR Fetch
* **Verification Detail**: Verify server returns proper document type.
* **Expected Result**: Response header `Content-Type` starts with `text/html`.

#### 49. WhatsApp Message Generation Correctness
* **Target Component**: `src/lib/whatsapp.ts`
* **Method**: Mock Zustand Store Unit Test
* **Verification Detail**: Feed `generateProductInquiry` with Product #1, verify format of query parameter string.
* **Expected Result**: Message contains encoded text including product name "Rose Bouquet — Classic Red" and price "₹1,499".

#### 50. Server Graceful Clean Shutdown Check
* **Target Component**: E2E runner orchestrator
* **Method**: Custom script test
* **Verification Detail**: Trigger test suite run and terminate. Verify port 3000 is free post-run.
* **Expected Result**: The spawned dev server is killed cleanly; subsequent attempts to connect to port 3000 fail immediately.

---

## 4. Proposed Implementation Plan for E2E Tests

If we were to implement E2E integration testing using only standard Node.js APIs, the testing workspace would look like this:

### 4.1 Directory Structure
We would create a dedicated directory `tests/e2e` in the project root:
```
tests/e2e/
├── run.mjs                  # The native test runner and server orchestrator
├── helpers.mjs              # Fetch wrappers, assertions, link parser
├── store.test.mjs           # Unit/integration tests for Zustand stores
├── ssr-routes.test.mjs      # HTML/SEO validation tests for core routes
└── crawler.test.mjs         # Link integrity crawler
```

### 4.2 How to Run
The test suite would be invoked via:
```bash
node tests/e2e/run.mjs
```
Which would internally handle:
1. Spawning Next.js.
2. Waiting for port 3000 to become active.
3. Executing all test scripts (`*.test.mjs`) using the native `node:test` APIs.
4. Aggregating results.
5. Terminating the Next.js process tree before exiting.
