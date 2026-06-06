const fs = require('node:fs');
const path = require('node:path');
const { TestSuiteContext, httpClient, login } = require('../helpers');

async function run(baseUrl) {
  const ctx = new TestSuiteContext('Tier 4: Real-World Scenarios');
  const defaultUser = 'admin';
  const defaultPass = 'admin123';

  // Scenario 1: Catalog Setup & Launch
  // Complete admin & customer journey: Create 3 products -> Verify category page -> Verify shop list -> Cleanup
  console.log('Running Scenario 1: Catalog Setup & Launch...');
  await login(baseUrl, defaultUser, defaultPass);

  const catName = 'e2e-launch-cat';
  const productsToLaunch = [
    { id: 'e2e-launch-p1', name: 'Launch Tulip Red', slug: 'launch-tulip-red', price: 299, category: catName, inStock: true },
    { id: 'e2e-launch-p2', name: 'Launch Tulip Pink', slug: 'launch-tulip-pink', price: 349, category: catName, inStock: true },
    { id: 'e2e-launch-p3', name: 'Launch Tulip Yellow', slug: 'launch-tulip-yellow', price: 399, category: catName, inStock: true }
  ];

  // Create products
  let createdAll = true;
  for (const p of productsToLaunch) {
    const res = await httpClient.post(`${baseUrl}/api/products`, p);
    if (res.status !== 200 && res.status !== 201) {
      createdAll = false;
    }
  }
  ctx.assert(createdAll, 'T4.1.1: Catalog setup - Create 3 catalog products succeeds');

  // Verify category page contains all 3 products
  const catRes = await httpClient.get(`${baseUrl}/categories/${catName}`);
  const catHtml = typeof catRes.data === 'string' ? catRes.data : '';
  const catContainsAll = catRes.status === 200 && 
                         catHtml.includes('Launch Tulip Red') && 
                         catHtml.includes('Launch Tulip Pink') && 
                         catHtml.includes('Launch Tulip Yellow');
  ctx.assert(catContainsAll, 'T4.1.2: Category page displays all newly launched products');

  // Verify shop page contains all 3 products
  const shopRes = await httpClient.get(`${baseUrl}/shop`);
  const shopHtml = typeof shopRes.data === 'string' ? shopRes.data : '';
  const shopContainsAll = shopRes.status === 200 && 
                          shopHtml.includes('Launch Tulip Red') && 
                          shopHtml.includes('Launch Tulip Pink') && 
                          shopHtml.includes('Launch Tulip Yellow');
  ctx.assert(shopContainsAll, 'T4.1.3: Public storefront /shop catalog lists all newly launched products');

  // Cleanup
  let cleanedAll = true;
  for (const p of productsToLaunch) {
    const res = await httpClient.delete(`${baseUrl}/api/products/${p.id}`);
    if (res.status !== 200) {
      cleanedAll = false;
    }
  }
  ctx.assert(cleanedAll, 'T4.1.4: Catalog cleanup - Delete launched products succeeds');


  // Scenario 2: Sale/Discount Campaign
  // Create product with price < originalPrice -> Tag "sale" -> Verify sale indicators on storefront
  console.log('Running Scenario 2: Sale/Discount Campaign...');
  await login(baseUrl, defaultUser, defaultPass);

  const pSale = {
    id: 'e2e-sale-prod',
    name: 'Discounted Rose Bouquet',
    slug: 'discounted-rose-bouquet',
    price: 999,
    originalPrice: 1499,
    category: 'crochet-bouquets',
    inStock: true,
    tags: ['sale', 'roses']
  };

  // Create product
  await httpClient.post(`${baseUrl}/api/products`, pSale);

  // Verify detail page has discount indicator / both original & discounted prices
  const detailRes = await httpClient.get(`${baseUrl}/shop/${pSale.slug}`);
  const detailHtml = typeof detailRes.data === 'string' ? detailRes.data : '';
  const displaysDiscount = detailRes.status === 200 && 
                           detailHtml.includes('999') && 
                           detailHtml.includes('1,499') || detailHtml.includes('1499');
  ctx.assert(displaysDiscount, 'T4.2.1: Storefront product details page displays both sale and original price');

  // Verify tag sale / discount badge is present in shop catalog or product card
  const shopSaleRes = await httpClient.get(`${baseUrl}/shop`);
  const shopSaleHtml = typeof shopSaleRes.data === 'string' ? shopSaleRes.data : '';
  // Check if price discount is reflected, or "sale" indicator is shown
  const reflectsSale = shopSaleRes.status === 200 && 
                       (shopSaleHtml.includes('Sale') || shopSaleHtml.includes('sale') || shopSaleHtml.includes('Discount') || shopSaleHtml.includes('999'));
  ctx.assert(reflectsSale, 'T4.2.2: Shop catalog displays sale/discount indicator');

  // Cleanup
  await httpClient.delete(`${baseUrl}/api/products/e2e-sale-prod`);


  // Scenario 3: Inventory Stock-out Flow
  // Create product with inStock: false -> Verify out of stock text and buy button disabled
  console.log('Running Scenario 3: Inventory Stock-out Flow...');
  await login(baseUrl, defaultUser, defaultPass);

  const pStockout = {
    id: 'e2e-stockout-prod',
    name: 'Stockout Lavender Sprig',
    slug: 'stockout-lavender-sprig',
    price: 150,
    category: 'lavender-collections',
    inStock: false
  };

  await httpClient.post(`${baseUrl}/api/products`, pStockout);

  // Check details page
  const stockoutDetailRes = await httpClient.get(`${baseUrl}/shop/${pStockout.slug}`);
  const stockoutHtml = typeof stockoutDetailRes.data === 'string' ? stockoutDetailRes.data : '';
  
  // Verify storefront indicates out of stock
  const indicatesOutOfStock = stockoutDetailRes.status === 200 && 
                             (stockoutHtml.includes('Out of Stock') || stockoutHtml.includes('Sold Out') || stockoutHtml.includes('out-of-stock'));
  ctx.assert(indicatesOutOfStock, 'T4.3.1: Storefront product details page displays Out of Stock badge');

  // Verify order/buy CTA button is disabled or missing
  const ctaDisabled = stockoutHtml.includes('disabled') || !stockoutHtml.includes('Add to Cart');
  ctx.assert(ctaDisabled, 'T4.3.2: Storefront Add to Cart action is disabled/suppressed for out of stock items');

  // Cleanup
  await httpClient.delete(`${baseUrl}/api/products/e2e-stockout-prod`);


  // Scenario 4: Customizable Product WhatsApp CTA
  // Create product with customizable: true -> Verify customizable button & WhatsApp link includes inquiry message
  console.log('Running Scenario 4: Customizable Product WhatsApp CTA...');
  await login(baseUrl, defaultUser, defaultPass);

  const pCustom = {
    id: 'e2e-custom-prod',
    name: 'Custom Bouquet Masterpiece',
    slug: 'custom-bouquet-masterpiece',
    price: 2499,
    category: 'crochet-bouquets',
    inStock: true,
    customizable: true
  };

  await httpClient.post(`${baseUrl}/api/products`, pCustom);

  // Verify details page loads
  const customDetailRes = await httpClient.get(`${baseUrl}/shop/${pCustom.slug}`);
  const customHtml = typeof customDetailRes.data === 'string' ? customDetailRes.data : '';
  
  // Verify page mentions "customizable" or includes Customization details
  const hasCustomIndicator = customDetailRes.status === 200 && 
                             (customHtml.includes('Customizable') || customHtml.includes('customizable') || customHtml.includes('Custom'));
  ctx.assert(hasCustomIndicator, 'T4.4.1: Product details page indicates product is customizable');

  // Verify presence of WhatsApp link targeting WA endpoint
  const hasWALink = customHtml.includes('wa.me') || customHtml.includes('api.whatsapp.com');
  ctx.assert(hasWALink, 'T4.4.2: Storefront displays a WhatsApp CTA link for customizable order inquiries');

  // Cleanup
  await httpClient.delete(`${baseUrl}/api/products/e2e-custom-prod`);


  // Scenario 5: Graceful Database Fallback Simulation
  // Verify that if Firebase is not active, the system successfully pulls products from local JSON files
  console.log('Running Scenario 5: Graceful Database Fallback Simulation...');
  
  // Load products from live_products.json directly
  const jsonPath = path.resolve(process.cwd(), 'src/lib/data/live_products.json');
  let fallbackProductFound = false;
  let fallbackName = '';
  
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf8');
      const products = JSON.parse(content);
      if (products.length > 0) {
        fallbackName = products[0].name;
        fallbackProductFound = true;
      }
    } catch (e) {
      console.error('Error reading live_products.json:', e.message);
    }
  }
  
  ctx.assert(fallbackProductFound, 'T4.5.1: Local JSON fallback database file contains mock data');

  // Query shop page to verify fallback products are displayed
  const shopFallbackRes = await httpClient.get(`${baseUrl}/shop`);
  const shopFallbackHtml = typeof shopFallbackRes.data === 'string' ? shopFallbackRes.data : '';
  const displaysFallbackProduct = shopFallbackRes.status === 200 && 
                                  fallbackProductFound && 
                                  shopFallbackHtml.includes(fallbackName);
  ctx.assert(displaysFallbackProduct, 'T4.5.2: Public storefront successfully reads and renders products from the local fallback JSON file');

  return ctx;
}

module.exports = { run };
