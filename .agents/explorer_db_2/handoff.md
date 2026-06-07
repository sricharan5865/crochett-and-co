# Handoff Report — Explorer 2

This report summarizes the database strategy investigation for Milestone M2.

## 1. Observation

- **Environment & Firebase Files**: 
  - Ran `find_by_name` with pattern `*env*` in `c:\Users\sri charan\Documents\projects\crochett-and-co` and found only `next-env.d.ts`. No `.env` or `.env.local` files exist.
  - Ran `find_by_name` with pattern `*firebase*` and found 0 results. No configuration or credential files exist in the codebase.
- **Runtimes & Dependencies**:
  - `package.json` line 17: `"next": "16.2.7"`. No `firebase` or `firebase-admin` packages are present in `dependencies`.
  - Next.js API Routes default to Node.js runtime, but can be configured for Edge runtime.
- **Default Products & Categories**:
  - `src/lib/data/categories.ts` lines 11-120: Defines `categories` array of type `Category[]` containing 12 categories (IDs "1" to "12").
  - `src/lib/data/products.ts` lines 24-398: Defines `products` array of type `Product[]` containing 20 products (IDs "1" to "20").
- **Password Hashing Run**:
  - Executed a temporary Node.js script using `crypto.pbkdf2Sync` and `crypto.scryptSync` with the input password `'adminpassword123'`. Outputted hashes:
    - **PBKDF2 (SHA-512, 100k iterations, salt `default_pbkdf2_salt_value_2026`)**: `39ffb22c6b9859869aea39307c58a3e371bf848ce12116eafef17021ab49369e3d7fcc790c3a203f832142dbe3f6b123b9d8d788657f4cae276c3ac82808ef97`
    - **scrypt (keylen 64, salt `default_scrypt_salt_value_2026`)**: `ae0846bb1c198e55073a904d5a5408a3aa6bf55566bc80a8c6436a4795a1912273128f263476111086ae3014a814640ab4c2808873f979f6a282a04a443257e2`

---

## 2. Logic Chain

1. **Environment Config**: Because no `.env` or credential files are present in the workspace, we must define standard Firebase configuration keys so that developers or runtime systems can provision the backend correctly. Standard Next.js practice uses `NEXT_PUBLIC_` prefixes for client-accessible variables and unprefixed variables for server-only environment variables (like service account details).
2. **Password Hashing & Runtimes**: 
   - Compiled `bcrypt` has native C++ dependencies that can cause build issues on development environments and will fail entirely in Next.js Edge runtime.
   - Pure JS `bcryptjs` resolves build issues and Edge runtime compatibility but runs slowly and requires a third-party dependency.
   - Node's built-in `crypto` module (via `scrypt` or `pbkdf2`) has zero external dependencies and runs natively at high speed, but is unavailable in the Edge runtime.
   - The Web Crypto API (`crypto.subtle`) is globally available in both Node.js and Edge runtimes, has zero dependencies, and supports PBKDF2.
   - **Conclusion**: If the API routes run on the default Node.js runtime, Node's built-in `scrypt` or `pbkdf2` is the ideal solution. If they run on the Edge runtime, PBKDF2 via Web Crypto API (`crypto.subtle`) is the ideal zero-dependency solution.
3. **Data Migration**: To ensure the fallback mode works seamlessly, the `live_categories.json` and `live_products.json` fallback files must contain exactly the 12 categories and 20 products from the TS files as their seed data.

---

## 3. Caveats

- **No Code Implementation**: This is a read-only investigation. No implementation code has been written to `src/lib/db.ts` or `src/lib/auth.ts`.
- **Occasions List**: `src/lib/data/categories.ts` also contains an `occasions` list of 7 items. Since occurrences of occasions are read-only and static across the storefront, they may not need dynamic CRUD capabilities, but they should be kept in mind during database/JSON fallback construction.

---

## 4. Conclusion

1. Implement a unified set of Firebase environment variables: 6 client-side (`NEXT_PUBLIC_FIREBASE_*`) and 2 server-side keys (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
2. Use Node's built-in `scryptSync` / `pbkdf2Sync` (Node runtime) or Web Crypto API (Edge runtime) for password hashing and verification. Avoid native `bcrypt` to prevent compilation or runtime crashes.
3. Seed `src/lib/data/live_categories.json` with the 12 default categories and `src/lib/data/live_products.json` with the 20 default products.

---

## 5. Verification Method

To independently verify this investigation's findings:
1. **Verify Password Hash Generation**:
   Run the following inline Node command to confirm the PBKDF2 hash output matches our result:
   ```bash
   node -e "console.log(require('crypto').pbkdf2Sync('adminpassword123', 'default_pbkdf2_salt_value_2026', 100000, 64, 'sha512').toString('hex'))"
   ```
   *Expected Output*: `39ffb22c6b9859869aea39307c58a3e371bf848ce12116eafef17021ab49369e3d7fcc790c3a203f832142dbe3f6b123b9d8d788657f4cae276c3ac82808ef97`
2. **Verify Static Data Count**:
   Inspect `src/lib/data/categories.ts` and `src/lib/data/products.ts` to confirm there are exactly 12 items in the `categories` array and 20 items in the `products` array.
