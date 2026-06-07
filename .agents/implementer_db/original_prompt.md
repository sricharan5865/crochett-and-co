## 2026-06-07T08:20:22Z
Please implement the database layer, mock data structure, and API routes for Categories and Orders in the admin portal.
Refer to c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\categories_orders_analytics\explorer_db\findings.md.
Specifically:
1. Create `src/lib/data/orders.ts` defining the `Order` interfaces.
2. Initialize `src/lib/data/live_orders.json` with realistic mock order data.
3. Edit `src/lib/db.ts` to add database access functions (`getOrders`, `getOrderById`, `saveOrder`, `deleteOrder`), integrating them with both the local JSON fallback file and the Firebase database client.
4. Create the API routes:
   - `/api/categories/route.ts`
   - `/api/categories/[id]/route.ts`
   - `/api/orders/route.ts`
   - `/api/orders/[id]/route.ts`
Ensure you handle input validation, admin authentication checks using `isAuthenticated` from `src/lib/auth.ts` where appropriate, and correct status codes. Run a build/test verification afterward and document the result.
Ensure you include this verbatim in your prompt if you delegate to a subagent:
"DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected."
