const { TestSuiteContext, httpClient, login } = require('../helpers');

async function run(baseUrl) {
  const ctx = new TestSuiteContext('Tier 1: Feature Coverage');
  
  // Feature 1: Admin Authentication
  console.log('Running Feature 1: Admin Authentication...');
  
  const defaultUser = 'admin';
  const defaultPass = 'admin123';
  
  // T1.1: Login with correct default credentials succeeds
  const loginCookie = await login(baseUrl, defaultUser, defaultPass);
  ctx.assert(loginCookie !== null, 'T1.1: Login with correct default credentials succeeds');
  
  // T1.2: Login with incorrect credentials fails
  const badCookie = await login(baseUrl, 'admin', 'wrongpassword');
  ctx.assert(badCookie === null, 'T1.2: Login with incorrect credentials fails');
  
  // T1.3: Accessing dashboard without session returns 401/403 or login redirect
  httpClient.clearCookie();
  const unauthRes = await httpClient.get(`${baseUrl}/admin/dashboard`);
  const isUnauth = unauthRes.status === 401 || unauthRes.status === 403 || 
                   (typeof unauthRes.data === 'string' && (unauthRes.data.includes('login') || unauthRes.data.includes('Login')));
  ctx.assert(isUnauth, 'T1.3: Accessing dashboard without session returns 401/403 or redirect');
  
  // T1.4: Accessing dashboard with valid session succeeds
  if (loginCookie) {
    httpClient.setCookie(loginCookie);
  }
  const authRes = await httpClient.get(`${baseUrl}/admin/dashboard`);
  ctx.assert(authRes.status === 200, 'T1.4: Accessing dashboard with valid session succeeds');
  
  // T1.5: Logout invalidates session
  await httpClient.post(`${baseUrl}/api/auth/logout`, {});
  const afterLogoutRes = await httpClient.get(`${baseUrl}/admin/dashboard`);
  const isPostLogoutUnauth = afterLogoutRes.status === 401 || afterLogoutRes.status === 403 || 
                             (typeof afterLogoutRes.data === 'string' && (afterLogoutRes.data.includes('login') || afterLogoutRes.data.includes('Login')));
  ctx.assert(isPostLogoutUnauth, 'T1.5: Logout invalidates session and dashboard access is blocked');

  // Feature 2: Admin Password Management
  console.log('Running Feature 2: Admin Password Management...');
  
  // Log back in to perform password actions
  await login(baseUrl, defaultUser, defaultPass);
  const newPass = 'newAdminPass456!';
  
  // T2.1: Changing password succeeds
  const changeRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, { 
    currentPassword: defaultPass,
    newPassword: newPass 
  });
  ctx.assert(changeRes.status === 200, 'T2.1: Changing password succeeds');
  
  // T2.2: Old password fails to authenticate post-change
  const oldLoginRes = await login(baseUrl, defaultUser, defaultPass);
  ctx.assert(oldLoginRes === null, 'T2.2: Old password fails to authenticate post-change');
  
  // T2.3: New password successfully authenticates post-change
  const newLoginRes = await login(baseUrl, defaultUser, newPass);
  ctx.assert(newLoginRes !== null, 'T2.3: New password successfully authenticates post-change');
  
  // T2.4: Attempting password change unauthenticated fails
  httpClient.clearCookie();
  const unauthChangeRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: newPass,
    newPassword: defaultPass
  });
  ctx.assert(unauthChangeRes.status === 401 || unauthChangeRes.status === 403, 'T2.4: Attempting password change unauthenticated fails');
  
  // T2.5: Restore default password works for idempotency
  await login(baseUrl, defaultUser, newPass);
  const restoreRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: newPass,
    newPassword: defaultPass
  });
  ctx.assert(restoreRes.status === 200, 'T2.5: Restoring default password succeeds');

  // Feature 3: Product Creation
  console.log('Running Feature 3: Product Creation...');
  await login(baseUrl, defaultUser, defaultPass);
  
  const testProduct = {
    id: "e2e-test-p1",
    name: "E2E Test Tulip Rose",
    slug: "e2e-test-tulip-rose",
    description: "Special crochet tulip rose bouquet for automated tests.",
    shortDescription: "Tulip Rose",
    price: 1599,
    category: "crochet-flowers",
    occasion: ["birthday"],
    inStock: true,
    customizable: true,
    tags: ["e2e", "tulip", "rose"]
  };
  
  let createdId = testProduct.id;
  
  // T3.1: Create product with standard fields succeeds
  const createRes = await httpClient.post(`${baseUrl}/api/products`, testProduct);
  ctx.assert(createRes.status === 200 || createRes.status === 201, 'T3.1: Create product with standard fields succeeds');
  if (createRes.data && createRes.data.id) {
    createdId = createRes.data.id;
  } else if (createRes.data && createRes.data.product && createRes.data.product.id) {
    createdId = createRes.data.product.id;
  }
  
  // T3.2: Verify created product is listed in admin dashboard
  const listRes = await httpClient.get(`${baseUrl}/api/products`);
  let isListed = false;
  if (listRes.status === 200 && Array.isArray(listRes.data)) {
    isListed = listRes.data.some(p => p.id === createdId || p.slug === testProduct.slug);
  }
  ctx.assert(isListed, 'T3.2: Verify created product is listed in dashboard');
  
  // T3.3: Verify created product appears in public /shop
  const shopRes = await httpClient.get(`${baseUrl}/shop`);
  const inShop = shopRes.status === 200 && typeof shopRes.data === 'string' && shopRes.data.includes(testProduct.name);
  ctx.assert(inShop, 'T3.3: Verify created product appears in public /shop catalog');
  
  // T3.4: Verify created product details page /shop/[slug] loads and shows correct fields
  const detailRes = await httpClient.get(`${baseUrl}/shop/${testProduct.slug}`);
  const detailLoaded = detailRes.status === 200 && typeof detailRes.data === 'string' && 
                       detailRes.data.includes(testProduct.name) && detailRes.data.includes(testProduct.description);
  ctx.assert(detailLoaded, 'T3.4: Verify created product details page /shop/[slug] loads and shows correct fields');
  
  // T3.5: Verify created product appears in its category /categories/[slug]
  const catRes = await httpClient.get(`${baseUrl}/categories/${testProduct.category}`);
  const inCat = catRes.status === 200 && typeof catRes.data === 'string' && catRes.data.includes(testProduct.name);
  ctx.assert(inCat, 'T3.5: Verify created product appears in its category /categories/[slug]');

  // Feature 4: Product Updating
  console.log('Running Feature 4: Product Updating...');
  
  const updatedProduct = {
    ...testProduct,
    name: "E2E Test Tulip Rose Updated",
    price: 1899,
    inStock: false
  };
  
  // T4.1: Edit product name, price, stock status
  const updateRes = await httpClient.put(`${baseUrl}/api/products/${createdId}`, updatedProduct);
  ctx.assert(updateRes.status === 200, 'T4.1: Edit product name, price, stock status succeeds');
  
  // T4.2: Verify edits appear in dashboard product list
  const listRes2 = await httpClient.get(`${baseUrl}/api/products`);
  let isUpdateListed = false;
  if (listRes2.status === 200 && Array.isArray(listRes2.data)) {
    const found = listRes2.data.find(p => p.id === createdId || p.slug === testProduct.slug);
    isUpdateListed = found && found.name === updatedProduct.name && found.price === updatedProduct.price;
  }
  ctx.assert(isUpdateListed, 'T4.2: Verify edits appear in dashboard product list');
  
  // T4.3: Verify edits appear on public /shop
  const shopRes2 = await httpClient.get(`${baseUrl}/shop`);
  const updateInShop = shopRes2.status === 200 && typeof shopRes2.data === 'string' && shopRes2.data.includes(updatedProduct.name);
  ctx.assert(updateInShop, 'T4.3: Verify edits appear on public /shop');
  
  // T4.4: Verify edits appear on /shop/[slug]
  const detailRes2 = await httpClient.get(`${baseUrl}/shop/${testProduct.slug}`);
  const updateInDetail = detailRes2.status === 200 && typeof detailRes2.data === 'string' && detailRes2.data.includes(updatedProduct.name);
  ctx.assert(updateInDetail, 'T4.4: Verify edits appear on /shop/[slug]');
  
  // T4.5: Update product inStock to false, verify storefront shows out-of-stock badge
  const hasOutOfStock = detailRes2.status === 200 && typeof detailRes2.data === 'string' && 
                        (detailRes2.data.includes('Out of Stock') || detailRes2.data.includes('Sold Out') || detailRes2.data.includes('disabled'));
  ctx.assert(hasOutOfStock, 'T4.5: Verify storefront shows out-of-stock badge / disabled actions');

  // Feature 5: Product Deletion
  console.log('Running Feature 5: Product Deletion...');
  
  // T5.1: Delete a product
  const deleteRes = await httpClient.delete(`${baseUrl}/api/products/${createdId}`);
  ctx.assert(deleteRes.status === 200, 'T5.1: Delete a product succeeds');
  
  // T5.2: Verify product is removed from dashboard list
  const listRes3 = await httpClient.get(`${baseUrl}/api/products`);
  let deletedRemovedList = true;
  if (listRes3.status === 200 && Array.isArray(listRes3.data)) {
    deletedRemovedList = !listRes3.data.some(p => p.id === createdId || p.slug === testProduct.slug);
  }
  ctx.assert(deletedRemovedList, 'T5.2: Verify product is removed from dashboard list');
  
  // T5.3: Verify product detail page /shop/[slug] returns 404
  const detailRes3 = await httpClient.get(`${baseUrl}/shop/${testProduct.slug}`);
  ctx.assert(detailRes3.status === 404, 'T5.3: Verify product detail page /shop/[slug] returns 404');
  
  // T5.4: Verify product is removed from /shop
  const shopRes3 = await httpClient.get(`${baseUrl}/shop`);
  const deletedRemovedShop = shopRes3.status === 200 && typeof shopRes3.data === 'string' && !shopRes3.data.includes(updatedProduct.name);
  ctx.assert(deletedRemovedShop, 'T5.4: Verify product is removed from /shop');
  
  // T5.5: Verify product is removed from category page
  const catRes3 = await httpClient.get(`${baseUrl}/categories/${testProduct.category}`);
  const deletedRemovedCat = catRes3.status === 200 && typeof catRes3.data === 'string' && !catRes3.data.includes(updatedProduct.name);
  ctx.assert(deletedRemovedCat, 'T5.5: Verify product is removed from category page');

  return ctx;
}

module.exports = { run };
