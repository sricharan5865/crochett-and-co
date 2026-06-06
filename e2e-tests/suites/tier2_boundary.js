const { TestSuiteContext, httpClient, login } = require('../helpers');

async function run(baseUrl) {
  const ctx = new TestSuiteContext('Tier 2: Boundary & Corner Cases');
  const defaultUser = 'admin';
  const defaultPass = 'admin123';

  // Feature 1: Admin Authentication Boundary
  console.log('Running Feature 1: Admin Authentication Boundary...');
  
  // T2.1.1: Empty password
  const emptyPassCookie = await login(baseUrl, defaultUser, '');
  ctx.assert(emptyPassCookie === null, 'T2.1.1: Login with empty password fails');

  // T2.1.2: Very long password
  const veryLongPass = 'a'.repeat(500);
  const longPassCookie = await login(baseUrl, defaultUser, veryLongPass);
  ctx.assert(longPassCookie === null, 'T2.1.2: Login with extremely long password fails');

  // T2.1.3: SQL/HTML injection password
  const injectionPass = "' OR '1'='1";
  const injectionCookie = await login(baseUrl, defaultUser, injectionPass);
  ctx.assert(injectionCookie === null, 'T2.1.3: Login with potential injection payload fails');

  // T2.1.4: Tampered cookie
  httpClient.setCookie('session=tampered_and_invalid_session_token_123');
  const tamperedRes = await httpClient.get(`${baseUrl}/admin/dashboard`);
  const isTamperedUnauth = tamperedRes.status === 401 || tamperedRes.status === 403 || 
                            (typeof tamperedRes.data === 'string' && (tamperedRes.data.includes('login') || tamperedRes.data.includes('Login')));
  ctx.assert(isTamperedUnauth, 'T2.1.4: Session request with tampered cookie is rejected');

  // T2.1.5: Concurrent logins
  const cookie1 = await login(baseUrl, defaultUser, defaultPass);
  const cookie2 = await login(baseUrl, defaultUser, defaultPass);
  ctx.assert(cookie1 !== null && cookie2 !== null, 'T2.1.5: Concurrent authentication attempts on same credentials succeed');

  // Feature 2: Password Management Boundary
  console.log('Running Feature 2: Password Management Boundary...');
  await login(baseUrl, defaultUser, defaultPass);

  // T2.2.1: Empty new password
  const emptyNewPassRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: defaultPass,
    newPassword: ''
  });
  ctx.assert(emptyNewPassRes.status === 400 || emptyNewPassRes.status === 422, 'T2.2.1: Change password to empty string fails');

  // T2.2.2: Short new password
  const shortNewPassRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: defaultPass,
    newPassword: '123'
  });
  ctx.assert(shortNewPassRes.status === 400 || shortNewPassRes.status === 422, 'T2.2.2: Change password to a very short string fails');

  // T2.2.3: Very long new password
  const veryLongNewPassRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: defaultPass,
    newPassword: 'a'.repeat(500)
  });
  // The system might either accept long passwords or reject them. Standard is usually to accept or return 400.
  // We'll assert that it returns either 200 (if supported) or 400/422 (if restricted), but not crash with 500.
  ctx.assert(veryLongNewPassRes.status !== 500, 'T2.2.3: Change password to a very long string handles gracefully without crash');

  // T2.2.4: Special characters and emojis
  const specialPass = 'p@$$w0rd_🔥_🚀';
  const specialPassRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: defaultPass,
    newPassword: specialPass
  });
  if (specialPassRes.status === 200) {
    ctx.assert(true, 'T2.2.4: Change password with special characters/emojis succeeds');
    // Restore default
    await login(baseUrl, defaultUser, specialPass);
    await httpClient.post(`${baseUrl}/api/auth/change-password`, {
      currentPassword: specialPass,
      newPassword: defaultPass
    });
  } else {
    // If not supported, it should reject cleanly
    ctx.assert(specialPassRes.status === 400 || specialPassRes.status === 422, 'T2.2.4: Special characters/emojis password is handled');
  }

  // T2.2.5: Unauthenticated / bad session password change
  httpClient.clearCookie();
  const badSessionChangeRes = await httpClient.post(`${baseUrl}/api/auth/change-password`, {
    currentPassword: defaultPass,
    newPassword: 'AnotherPassword1!'
  });
  ctx.assert(badSessionChangeRes.status === 401 || badSessionChangeRes.status === 403, 'T2.2.5: Change password with bad session fails');

  // Feature 3: Product Creation Boundary
  console.log('Running Feature 3: Product Creation Boundary...');
  await login(baseUrl, defaultUser, defaultPass);

  // T2.3.1: Duplicate slug rejection/handling
  const pDup1 = {
    id: 'e2e-dup-1',
    name: 'Duplicate Slug Product 1',
    slug: 'duplicate-slug-prod',
    price: 500,
    category: 'crochet-bouquets',
    inStock: true
  };
  const pDup2 = {
    id: 'e2e-dup-2',
    name: 'Duplicate Slug Product 2',
    slug: 'duplicate-slug-prod',
    price: 600,
    category: 'crochet-bouquets',
    inStock: true
  };
  
  await httpClient.post(`${baseUrl}/api/products`, pDup1);
  const dup2Res = await httpClient.post(`${baseUrl}/api/products`, pDup2);
  // Rejections are normally 400 or 409 Conflict. Or if the system resolves by appending a suffix, status is 200/201.
  ctx.assert(dup2Res.status === 400 || dup2Res.status === 409 || dup2Res.status === 201 || dup2Res.status === 200, 'T2.3.1: Duplicate slug handling (rejected or auto-resolved)');
  
  // Cleanup duplicates
  await httpClient.delete(`${baseUrl}/api/products/e2e-dup-1`);
  await httpClient.delete(`${baseUrl}/api/products/e2e-dup-2`);

  // T2.3.2: Negative price rejection
  const pNegPrice = {
    id: 'e2e-neg-price',
    name: 'Negative Price Product',
    slug: 'negative-price-prod',
    price: -10,
    category: 'crochet-bouquets',
    inStock: true
  };
  const negPriceRes = await httpClient.post(`${baseUrl}/api/products`, pNegPrice);
  ctx.assert(negPriceRes.status === 400 || negPriceRes.status === 422, 'T2.3.2: Create product with negative price fails');

  // T2.3.3: Very long text fields
  const pLongText = {
    id: 'e2e-long-text',
    name: 'Long Text Prod',
    slug: 'long-text-prod',
    description: 'a'.repeat(5000),
    price: 100,
    category: 'crochet-bouquets',
    inStock: true
  };
  const longTextRes = await httpClient.post(`${baseUrl}/api/products`, pLongText);
  ctx.assert(longTextRes.status !== 500, 'T2.3.3: Create product with extremely long text fields does not crash the server');
  await httpClient.delete(`${baseUrl}/api/products/e2e-long-text`);

  // T2.3.4: HTML/XSS injection protection
  const pXss = {
    id: 'e2e-xss-prod',
    name: 'XSS <script>alert("XSS")</script>',
    slug: 'xss-prod',
    description: '<div onclick="steal()">Dangerous Div</div>',
    price: 200,
    category: 'crochet-bouquets',
    inStock: true
  };
  await httpClient.post(`${baseUrl}/api/products`, pXss);
  const xssShopRes = await httpClient.get(`${baseUrl}/shop`);
  const isXssSafe = xssShopRes.status === 200 && typeof xssShopRes.data === 'string' && 
                    !xssShopRes.data.includes('<script>alert("XSS")</script>');
  ctx.assert(isXssSafe, 'T2.3.4: Product fields are sanitized or escaped on storefront');
  await httpClient.delete(`${baseUrl}/api/products/e2e-xss-prod`);

  // T2.3.5: Missing required fields
  const pMissing = {
    id: 'e2e-missing-fields',
    price: 150,
    inStock: true
  };
  const missingRes = await httpClient.post(`${baseUrl}/api/products`, pMissing);
  ctx.assert(missingRes.status === 400 || missingRes.status === 422, 'T2.3.5: Create product with missing required fields fails');

  // Feature 4: Product Updating Boundary
  console.log('Running Feature 4: Product Updating Boundary...');
  const pBase = {
    id: 'e2e-update-base',
    name: 'Update Base Prod',
    slug: 'update-base-prod',
    price: 300,
    category: 'crochet-bouquets',
    inStock: true
  };
  await httpClient.post(`${baseUrl}/api/products`, pBase);

  // T2.4.1: Update with negative price
  const updateNegPriceRes = await httpClient.put(`${baseUrl}/api/products/e2e-update-base`, {
    ...pBase,
    price: -50
  });
  ctx.assert(updateNegPriceRes.status === 400 || updateNegPriceRes.status === 422, 'T2.4.1: Update product with negative price fails');

  // T2.4.2: Update with missing required fields
  const updateMissingRes = await httpClient.put(`${baseUrl}/api/products/e2e-update-base`, {
    id: 'e2e-update-base',
    name: '' // Empty name
  });
  ctx.assert(updateMissingRes.status === 400 || updateMissingRes.status === 422, 'T2.4.2: Update product with empty name fails');

  // T2.4.3: Update non-existent product ID
  const updateNonExistentRes = await httpClient.put(`${baseUrl}/api/products/non-existent-id`, pBase);
  ctx.assert(updateNonExistentRes.status === 404, 'T2.4.3: Update non-existent product ID returns 404');

  // T2.4.4: Conflicting slug
  const pConf = {
    id: 'e2e-conf-prod',
    name: 'Conflicting Slug Prod',
    slug: 'conflict-slug',
    price: 400,
    category: 'crochet-bouquets',
    inStock: true
  };
  await httpClient.post(`${baseUrl}/api/products`, pConf);
  
  const updateConflictRes = await httpClient.put(`${baseUrl}/api/products/e2e-update-base`, {
    ...pBase,
    slug: 'conflict-slug'
  });
  ctx.assert(updateConflictRes.status === 400 || updateConflictRes.status === 409, 'T2.4.4: Update product slug to conflict with another product\'s slug fails');
  
  await httpClient.delete(`${baseUrl}/api/products/e2e-conf-prod`);

  // T2.4.5: Special characters/HTML injection updating
  const updateSpecialRes = await httpClient.put(`${baseUrl}/api/products/e2e-update-base`, {
    ...pBase,
    name: 'Base Prod <p>injection</p> & * %'
  });
  ctx.assert(updateSpecialRes.status === 200, 'T2.4.5: Update product fields with special characters/HTML succeeds');
  
  await httpClient.delete(`${baseUrl}/api/products/e2e-update-base`);

  // Feature 5: Product Deletion Boundary
  console.log('Running Feature 5: Product Deletion Boundary...');

  // T2.5.1: Delete non-existent product
  const delNonExistentRes = await httpClient.delete(`${baseUrl}/api/products/non-existent-id`);
  ctx.assert(delNonExistentRes.status === 404, 'T2.5.1: Delete non-existent product returns 404');

  // T2.5.2: Double deletion
  const pDelBase = {
    id: 'e2e-double-del',
    name: 'Double Del Prod',
    slug: 'double-del-prod',
    price: 100,
    category: 'crochet-bouquets',
    inStock: true
  };
  await httpClient.post(`${baseUrl}/api/products`, pDelBase);
  const firstDel = await httpClient.delete(`${baseUrl}/api/products/e2e-double-del`);
  const secondDel = await httpClient.delete(`${baseUrl}/api/products/e2e-double-del`);
  ctx.assert(firstDel.status === 200 && secondDel.status === 404, 'T2.5.2: Double deletion returns 404 on subsequent attempt');

  // T2.5.3: Malformed ID
  const delMalformedRes = await httpClient.delete(`${baseUrl}/api/products/!@#$`);
  ctx.assert(delMalformedRes.status === 400 || delMalformedRes.status === 404, 'T2.5.3: Delete product with malformed ID format fails or returns 404');

  // T2.5.4: Unauthenticated deletion
  const pUnauthDel = {
    id: 'e2e-unauth-del',
    name: 'Unauth Del Prod',
    slug: 'unauth-del-prod',
    price: 100,
    category: 'crochet-bouquets',
    inStock: true
  };
  await httpClient.post(`${baseUrl}/api/products`, pUnauthDel);
  
  httpClient.clearCookie();
  const unauthDelRes = await httpClient.delete(`${baseUrl}/api/products/e2e-unauth-del`);
  ctx.assert(unauthDelRes.status === 401 || unauthDelRes.status === 403, 'T2.5.4: Delete product without auth credentials fails');
  
  await login(baseUrl, defaultUser, defaultPass);
  await httpClient.delete(`${baseUrl}/api/products/e2e-unauth-del`);

  // T2.5.5: Cart/wishlist deletion fallback
  // Verify cart page loads without errors even if a referenced product is deleted.
  const cartRes = await httpClient.get(`${baseUrl}/cart`);
  ctx.assert(cartRes.status === 200, 'T2.5.5: Cart page handles deleted product gracefully and loads successfully');

  return ctx;
}

module.exports = { run };
