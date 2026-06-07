# Database Design Strategy & Analysis Report (Milestone M2)

This report details the findings and recommendations of Explorer 2 for the database design strategy in Milestone M2 of the Crochett & Co Admin Portal.

---

## 1. Environment Configuration & Firebase Credentials

### Direct Observations
- **No environment files** (such as `.env`, `.env.local`, `.env.production`, or `.env.development`) exist in the project root directory.
- **No Firebase config files** or credentials (like service account JSON keys) are present in the codebase.
- `package.json` does not yet contain any database-related packages such as `firebase` or `firebase-admin`.

### Recommendations for Firebase Configuration Environment Variables
To support the dynamic dual-mode data access layer (supporting either Firebase or a local JSON fallback), the application should look for specific environment variables. We recommend the following configuration:

#### A. Client-Side / Public SDK Configuration (e.g., for direct frontend reads or client-side operations):
- `NEXT_PUBLIC_FIREBASE_API_KEY`: The API key for the Firebase project.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: The Auth domain for authentication redirect flow.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: The unique ID of the Firebase project.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: The bucket name for storing images.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: The sender ID for Cloud Messaging.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: The App ID for the web app configuration.

#### B. Server-Side / Admin SDK Configuration (Highly recommended for secure Firestore writes & password checks in API routes):
- `FIREBASE_PROJECT_ID`: Reuses/defaults to the client Project ID if not explicitly set.
- `FIREBASE_CLIENT_EMAIL`: The service account client email.
- `FIREBASE_PRIVATE_KEY`: The service account private key (e.g., obtained from the Firebase Console). 
  *Note: Since private keys contain newlines, the code initializing the SDK must escape them:* `process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')`.

---

## 2. Password Hashing Strategy

We need to hash the default admin password `'adminpassword123'` for initial deployment and store it in `src/lib/data/admin_config.json`. We analyzed four main options for Next.js runtime compatibility (Node.js vs Edge).

### Comparison of Hashing Strategies

| Strategy | Security Level | Edge Runtime Compatible | External Dependencies | Recommendation & Suitability |
| :--- | :--- | :--- | :--- | :--- |
| **`bcrypt`** (native) | High | **No** (fails on Edge due to native C++ bindings) | Yes (`bcrypt`) | Fails in Edge runtime. Can cause compiler/build issues on local Windows dev environments. |
| **`bcryptjs`** | High | **Yes** (pure JS implementation) | Yes (`bcryptjs`) | Good fallback, but runs slower in JS and requires an external dependency. |
| **Node.js `crypto` (`scryptSync` / `pbkdf2Sync`)** | High | **No** (legacy Node modules are unsupported on Edge) | **No** (Built-in Node module) | **Highly Recommended** if Next.js API routes run in the standard Node.js runtime. High performance, native execution, zero dependencies. |
| **Web Crypto API (`crypto.subtle` + PBKDF2)** | High | **Yes** (Global browser-compatible API) | **No** (Native globally available API) | **Recommended** if Next.js API routes need to support the **Edge runtime** (Vercel Edge functions / Cloudflare Workers). Zero dependencies. |
| **Simple SHA-256** | Low | Yes | No | **Not Recommended**: Fast non-stretching hash that is highly vulnerable to brute-force and rainbow table attacks. |

### Hashing Recommendation
We recommend using Node's built-in **`scrypt`** (via `crypto.scryptSync`) or **PBKDF2** (via `crypto.pbkdf2Sync`) if the API routes run in the standard Node.js runtime. 

If there is a strong requirement for Edge runtime support, we recommend using the **Web Crypto API (PBKDF2)** through the global `crypto.subtle` object, avoiding external package installs.

### Reference Hashes for 'adminpassword123'
Below are exact pre-computed hashes and salt configurations for both recommended built-in strategies, ready to be placed in `src/lib/data/admin_config.json`:

#### Option 1: PBKDF2 (100,000 iterations, SHA-512)
- **Salt**: `default_pbkdf2_salt_value_2026`
- **Hash**: `39ffb22c6b9859869aea39307c58a3e371bf848ce12116eafef17021ab49369e3d7fcc790c3a203f832142dbe3f6b123b9d8d788657f4cae276c3ac82808ef97`
- **JSON Configuration (`src/lib/data/admin_config.json`)**:
  ```json
  {
    "salt": "default_pbkdf2_salt_value_2026",
    "hash": "39ffb22c6b9859869aea39307c58a3e371bf848ce12116eafef17021ab49369e3d7fcc790c3a203f832142dbe3f6b123b9d8d788657f4cae276c3ac82808ef97",
    "iterations": 100000,
    "digest": "sha512"
  }
  ```

#### Option 2: scrypt (64-byte key length)
- **Salt**: `default_scrypt_salt_value_2026`
- **Hash**: `ae0846bb1c198e55073a904d5a5408a3aa6bf55566bc80a8c6436a4795a1912273128f263476111086ae3014a814640ab4c2808873f979f6a282a04a443257e2`
- **JSON Configuration (`src/lib/data/admin_config.json`)**:
  ```json
  {
    "salt": "default_scrypt_salt_value_2026",
    "hash": "ae0846bb1c198e55073a904d5a5408a3aa6bf55566bc80a8c6436a4795a1912273128f263476111086ae3014a814640ab4c2808873f979f6a282a04a443257e2",
    "keylen": 64
  }
  ```

---

## 3. Product & Category Migration Targets

The following arrays must be extracted from the static TypeScript files and migrated to their respective JSON fallback storage targets.

### A. Categories (to `src/lib/data/live_categories.json`)
There are **12 default categories** defined in `src/lib/data/categories.ts` to be migrated:

1. **Crochet Bouquets** (`id`: "1", `slug`: "crochet-bouquets")
2. **Crochet Flowers** (`id`: "2", `slug`: "crochet-flowers")
3. **Tulips** (`id`: "3", `slug`: "tulips")
4. **Roses** (`id`: "4", `slug`: "roses")
5. **Sunflowers** (`id`: "5", `slug`: "sunflowers")
6. **Lavender Collections** (`id`: "6", `slug`: "lavender-collections")
7. **Hair Clips** (`id`: "7", `slug`: "hair-clips")
8. **Crochet Bags** (`id`: "8", `slug`: "crochet-bags")
9. **Keychains** (`id`: "9", `slug`: "keychains")
10. **Gift Hampers** (`id`: "10", `slug`: "gift-hampers")
11. **Custom Orders** (`id`: "11", `slug`: "custom-orders")
12. **Seasonal Collections** (`id`: "12", `slug`: "seasonal-collections")

*Note: In `src/lib/data/categories.ts`, there is also an `occasions` list (7 occasions) that is used for filtering products. If the database schema treats occasions as dynamic metadata, they can also be migrated. However, they are currently read-only in the storefront and are not included in the Admin CRUD scope in `PROJECT.md`.*

### B. Products (to `src/lib/data/live_products.json`)
There are **20 default products** defined in `src/lib/data/products.ts` to be migrated:

1. **Rose Bouquet — Classic Red** (`id`: "1", `slug`: "rose-bouquet-classic-red")
2. **Sunflower Sunshine Bouquet** (`id`: "2", `slug`: "sunflower-sunshine-bouquet")
3. **Lavender Dreams Collection** (`id`: "3", `slug`: "lavender-dreams-collection")
4. **Tulip Garden — Mixed Colors** (`id`: "4", `slug`: "tulip-garden-mixed-colors")
5. **Pink Rose Single Stem** (`id`: "5", `slug`: "pink-rose-single-stem")
6. **Daisy Chain Hair Clip Set** (`id`: "6", `slug`: "daisy-chain-hair-clip-set")
7. **Crochet Tote Bag — Sage Green** (`id`: "7", `slug`: "crochet-tote-bag-sage-green")
8. **Flower Keychain — Rose** (`id`: "8", `slug`: "flower-keychain-rose")
9. **Valentine's Special Gift Hamper** (`id`: "9", `slug`: "valentines-special-gift-hamper")
10. **Graduation Bouquet — Mixed Flowers** (`id`: "10", `slug`: "graduation-bouquet-mixed-flowers")
11. **Mini Succulent Set** (`id`: "11", `slug`: "mini-succulent-set")
12. **Romantic Pink Bouquet — Large** (`id`: "12", `slug`: "romantic-pink-bouquet-large")
13. **Crochet Flower Crown** (`id`: "13", `slug`: "crochet-flower-crown")
14. **Friendship Bracelet Set** (`id`: "14", `slug`: "friendship-bracelet-set")
15. **Mother's Day Special Hamper** (`id`: "15", `slug`: "mothers-day-special-hamper")
16. **Crochet Crossbody Bag — Cream** (`id`: "16", `slug`: "crochet-crossbody-bag-cream")
17. **Rainbow Tulip Bouquet** (`id`: "17", `slug`: "rainbow-tulip-bouquet")
18. **Strawberry Keychain** (`id`: "18", `slug`: "strawberry-keychain")
19. **Custom Design — Your Imagination** (`id`: "19", `slug`: "custom-design-your-imagination")
20. **Cherry Blossom Branch** (`id`: "20", `slug`: "cherry-blossom-branch")
