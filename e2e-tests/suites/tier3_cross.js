const fs = require('node:fs');
const path = require('node:path');
const { TestSuiteContext, httpClient, login } = require('../helpers');

async function run(baseUrl) {
  const ctx = new TestSuiteContext('Tier 3: Cross-Feature Combinations');
  const defaultUser = 'admin';
  const defaultPass = 'admin123';

  // T3.1: Full Auth + CRUD Lifecycle
  // Login -> Create -> Update -> Logout -> Verify Public -> Login -> Delete
  console.log('Running T3.1: Full Auth + CRUD Lifecycle...');
  
  // 1. Login
  const cookie1 = await login(baseUrl, defaultUser, defaultPass);
  ctx.assert(cookie1 !== null, 'T3.1.1: Login succeeds');

  // 2. Create
  const pLife = {
    id: 'e2e-lifecycle-prod',
    name: 'Lifecycle Crochet Flower',
    slug: 'lifecycle-crochet-flower',
    price: 499,
    category: 'crochet-flowers',
    inStock: true
  };
  const createRes = await httpClient.post(`${baseUrl}/api/products`, pLife);
  ctx.assert(createRes.status === 200 || createRes.status === 201, 'T3.1.2: Product creation succeeds');

  // 3. Update
  const updatedPLife = { ...pLife, price: 549, name: 'Lifecycle Crochet Flower Updated' };
  const updateRes = await httpClient.put(`${baseUrl}/api/products/e2e-lifecycle-prod`, updatedPLife);
  ctx.assert(updateRes.status === 200, 'T3.1.3: Product update succeeds');

  // 4. Logout
  await httpClient.post(`${baseUrl}/api/auth/logout`, {});

  // 5. Verify Public storefront still displays the updated product
  const shopRes = await httpClient.get(`${baseUrl}/shop`);
  const inShop = shopRes.status === 200 && typeof shopRes.data === 'string' && shopRes.data.includes(updatedPLife.name);
  ctx.assert(inShop, 'T3.1.4: Updated product appears on storefront after admin logout');

  // 6. Login again to clean up
  await login(baseUrl, defaultUser, defaultPass);

  // 7. Delete
  const deleteRes = await httpClient.delete(`${baseUrl}/api/products/e2e-lifecycle-prod`);
  ctx.assert(deleteRes.status === 200, 'T3.1.5: Product deletion succeeds');


  // T3.2: Auth Change Flow
  // Login -> Change Password -> Logout -> Login old (fails) -> Login new (passes) -> Restore default password
  console.log('Running T3.2: Auth Change Flow...');
  
  // 1. Login
  await login(baseUrl, defaultUser, defaultPass);

  // 2. Change password
  const tempPass = 'tempSecretPass99!';
  const changeRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: defaultPass,
    newPassword: tempPass
  });
  ctx.assert(changeRes.status === 200, 'T3.2.1: Password change succeeds');

  // 3. Logout
  await httpClient.post(`${baseUrl}/api/auth/logout`, {});

  // 4. Login old (fails)
  const loginOldCookie = await login(baseUrl, defaultUser, defaultPass);
  ctx.assert(loginOldCookie === null, 'T3.2.2: Login with old password fails');

  // 5. Login new (passes)
  const loginNewCookie = await login(baseUrl, defaultUser, tempPass);
  ctx.assert(loginNewCookie !== null, 'T3.2.3: Login with new password succeeds');

  // 6. Restore default password
  const restoreRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: tempPass,
    newPassword: defaultPass
  });
  ctx.assert(restoreRes.status === 200, 'T3.2.4: Restore default password succeeds');


  // T3.3: Persistence / Reload simulation
  // Create product -> Check physical fallback database persistence -> Verify storefront retrieval
  console.log('Running T3.3: Persistence / Reload simulation...');
  await login(baseUrl, defaultUser, defaultPass);

  const pPersist = {
    id: 'e2e-persist-prod',
    name: 'Persistent Crochet Sunflower',
    slug: 'persistent-crochet-sunflower',
    price: 1200,
    category: 'crochet-bouquets',
    inStock: true
  };

  // Create product
  await httpClient.post(`${baseUrl}/api/products`, pPersist);

  // Check physical fallback JSON file exists and contains the product
  const jsonPath = path.resolve(process.cwd(), 'src/lib/data/live_products.json');
  let filePersisted = false;
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf8');
      const products = JSON.parse(content);
      filePersisted = products.some(p => p.id === pPersist.id || p.slug === pPersist.slug);
    } catch (e) {
      console.error('Error reading live_products.json for persistence verification:', e.message);
    }
  }
  ctx.assert(filePersisted, 'T3.3.1: Created product is physically persisted to the local JSON database file');

  // Verify storefront loads it
  const storefrontDetailRes = await httpClient.get(`${baseUrl}/shop/${pPersist.slug}`);
  const inStorefront = storefrontDetailRes.status === 200 && typeof storefrontDetailRes.data === 'string' && storefrontDetailRes.data.includes(pPersist.name);
  ctx.assert(inStorefront, 'T3.3.2: Storefront serves the persisted product correctly');

  // Clean up
  await httpClient.delete(`${baseUrl}/api/products/e2e-persist-prod`);


  // T3.4: Storefront Cart Price Update (Contract validation)
  // Create product -> Query price -> Update price in admin -> Verify updated price reflects (sync source)
  console.log('Running T3.4: Storefront Cart Price Update...');
  await login(baseUrl, defaultUser, defaultPass);

  const pCartSync = {
    id: 'e2e-cart-sync-prod',
    name: 'Cart Sync Item',
    slug: 'cart-sync-item',
    price: 399,
    category: 'crochet-bouquets',
    inStock: true
  };

  // 1. Create product
  await httpClient.post(`${baseUrl}/api/products`, pCartSync);

  // 2. Fetch it to confirm initial price
  const initialGet = await httpClient.get(`${baseUrl}/api/products/${pCartSync.id}`);
  let initialPriceMatches = false;
  if (initialGet.status === 200 && initialGet.data) {
    initialPriceMatches = initialGet.data.price === pCartSync.price;
  }
  ctx.assert(initialGet.status === 200 && initialPriceMatches, 'T3.4.1: Retrieve product details succeeds and matches initial price');

  // 3. Update price in admin
  const updatedPrice = 449;
  await httpClient.put(`${baseUrl}/api/products/${pCartSync.id}`, {
    ...pCartSync,
    price: updatedPrice
  });

  // 4. Verify detail API serves updated price (which the client-side cart uses to sync prices)
  const postUpdateGet = await httpClient.get(`${baseUrl}/api/products/${pCartSync.id}`);
  let priceSynced = false;
  if (postUpdateGet.status === 200 && postUpdateGet.data) {
    priceSynced = postUpdateGet.data.price === updatedPrice;
  }
  ctx.assert(priceSynced, 'T3.4.2: Product API endpoint yields updated price for cart sync validation');

  // Cleanup
  await httpClient.delete(`${baseUrl}/api/products/e2e-cart-sync-prod`);


  // T3.5: Storefront Cart Deletion (Contract validation)
  // Create product -> Verify details -> Delete product -> Verify details returns 404 (cart item invalidation)
  console.log('Running T3.5: Storefront Cart Deletion...');
  await login(baseUrl, defaultUser, defaultPass);

  const pCartDel = {
    id: 'e2e-cart-del-prod',
    name: 'Cart Deletion Item',
    slug: 'cart-deletion-item',
    price: 150,
    category: 'keychains',
    inStock: true
  };

  // 1. Create product
  await httpClient.post(`${baseUrl}/api/products`, pCartDel);

  // 2. Verify it is reachable
  const beforeDelGet = await httpClient.get(`${baseUrl}/api/products/${pCartDel.id}`);
  ctx.assert(beforeDelGet.status === 200, 'T3.5.1: Product details endpoint is reachable before deletion');

  // 3. Delete product
  await httpClient.delete(`${baseUrl}/api/products/${pCartDel.id}`);

  // 4. Verify details returns 404 (which allows client-side cart to drop/invalidate deleted items)
  const afterDelGet = await httpClient.get(`${baseUrl}/api/products/${pCartDel.id}`);
  ctx.assert(afterDelGet.status === 404, 'T3.5.2: Product details endpoint returns 404 after deletion for cart invalidation');

  return ctx;
}

module.exports = { run };
