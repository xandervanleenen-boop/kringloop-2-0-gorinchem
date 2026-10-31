import * as cheerio from 'cheerio';

const SITE = 'https://www.kringloop20gorinchem.nl';
const MAX_PRODUCTS_PER_SYNC = Number(process.env.MAX_PRODUCTS_PER_SYNC || 250);
const REQUEST_TIMEOUT_MS = 10000;

async function getText(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.kringloop20gorinchem.nl') {
    throw new Error('Blocked non-approved catalog URL');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Kringloop20Catalog/1.0 (+public read-only product catalogue)', Accept: 'text/html,application/xml,text/xml' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Public site returned ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseSitemapLocations(xml) {
  return [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gis)].map(m => m[1].replaceAll('&amp;', '&').trim());
}

async function findProductUrls() {
  let sitemapCandidates = [`${SITE}/sitemap.xml`, `${SITE}/sitemap_index.xml`];
  try {
    const robots = await getText(`${SITE}/robots.txt`);
    const advertised = [...robots.matchAll(/^sitemap:\s*(https:\/\/\S+)/gim)].map(m => m[1].trim());
    if (advertised.length) sitemapCandidates = [...new Set([...advertised, ...sitemapCandidates])];
  } catch { /* Conventional sitemap paths are the fallback. */ }
  let locations = [];
  for (const sitemapUrl of sitemapCandidates) {
    try {
      const xml = await getText(sitemapUrl);
      locations = parseSitemapLocations(xml);
      if (locations.length) break;
    } catch { /* Try the next conventional sitemap path. */ }
  }
  if (!locations.length) throw new Error('No public sitemap found; ask JouwWeb/site administrator for a supported product export');

  // Follow one sitemap-index level only and stay on the exact approved host.
  const nested = locations.filter(u => /sitemap/i.test(u) && !/\/product\//i.test(u)).slice(0, 20);
  for (const url of nested) {
    try {
      const child = parseSitemapLocations(await getText(url));
      locations.push(...child);
    } catch { /* Continue with the other public sitemap entries. */ }
  }
  return [...new Set(locations.filter(u => {
    try { const p = new URL(u); return p.protocol === 'https:' && p.hostname === 'www.kringloop20gorinchem.nl' && /\/product\//i.test(p.pathname); }
    catch { return false; }
  }))].slice(0, MAX_PRODUCTS_PER_SYNC);
}

function parsePrice(value) {
  if (value == null) return null;
  const normalized = String(value).trim().replace(/\s/g, '').replace(/€/g, '').replace(/,(?=\d{2}$)/, '.');
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function productFromHtml(url, html) {
  const $ = cheerio.load(html);
  const meta = selector => $(selector).first().attr('content') || null;
  const jsonLdNodes = $('script[type="application/ld+json"]').toArray();
  let structured = [];
  for (const node of jsonLdNodes) {
    try {
      const value = JSON.parse($(node).text());
      const flatten = v => {
        if (Array.isArray(v)) return v.flatMap(flatten);
        if (v && typeof v === 'object') return [v, ...(Array.isArray(v['@graph']) ? v['@graph'].flatMap(flatten) : [])];
        return [];
      };
      structured.push(...flatten(value));
    } catch { /* Ignore invalid or unrelated structured metadata. */ }
  }
  const product = structured.find(x => {
    const t = Array.isArray(x['@type']) ? x['@type'] : [x['@type']];
    return t.some(v => v === 'Product' || v === 'ProductGroup');
  });
  const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
  const name = product?.name || meta('meta[property="og:title"]') || $('h1').first().text().trim();
  const rawImage = (Array.isArray(product?.image) ? product.image[0] : product?.image) || meta('meta[property="og:image"]');
  let imageUrl = null;
  try { const u = new URL(typeof rawImage === 'string' ? rawImage : rawImage?.url, SITE); if (u.protocol === 'https:') imageUrl = u.href; } catch {}
  const price = parsePrice(offer?.price ?? meta('meta[property="product:price:amount"]') ?? $('[itemprop="price"]').first().attr('content'));
  const sku = product?.sku || product?.mpn || $('body').text().match(/Artikelnummer:\s*([\w.-]+)/i)?.[1] || url;
  const description = product?.description || meta('meta[property="og:description"]') || '';
  const availabilityValue = String(offer?.availability || '').toLowerCase();
  const availability = availabilityValue.endsWith('instock') ? 'in_stock' : availabilityValue.endsWith('outofstock') ? 'out_of_stock' : 'unknown';
  const category = (product?.category || $('nav[aria-label*="breadcrumb"] a').last().text().trim() || 'Overig');
  if (!name || price == null) return null;
  return {
    id: String(sku).slice(0, 160),
    name: String(name).replace(/\s+/g, ' ').trim().slice(0, 180),
    category: String(category).replace(/\s+/g, ' ').trim().slice(0, 60) || 'Overig',
    price,
    imageUrl,
    url,
    availability,
    stockCheckedAt: availability === 'unknown' ? null : new Date().toISOString(),
    note: String(description).replace(/\s+/g, ' ').trim().slice(0, 200),
  };
}

let cached = null;
let cachedAt = 0;
let inFlight = null;

/**
 * Read-only public-page connector for a limited pilot. It is deliberately off by
 * default. This is not a documented JouwWeb product API and must only be enabled
 * after the site owner approves public-page collection. Stock remains unknown
 * unless the page itself exposes explicit structured availability.
 */
export async function getOfficialCatalog() {
  if (process.env.CATALOG_SOURCE !== 'public-site' || process.env.PUBLIC_CATALOG_CRAWLER_ALLOWED !== 'true') {
    throw new Error('Catalog source is not enabled. Confirm JouwWeb-supported feed/export or explicitly approve the read-only public-site pilot.');
  }
  const ttl = Math.max(60, Number(process.env.CATALOG_CACHE_SECONDS || 900)) * 1000;
  if (cached && Date.now() - cachedAt < ttl) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const urls = await findProductUrls();
    const products = [];
    // Keep request concurrency low and skip pages that do not expose price metadata.
    for (let i = 0; i < urls.length; i += 3) {
      const batch = await Promise.all(urls.slice(i, i + 3).map(async url => {
        try { return productFromHtml(url, await getText(url)); } catch { return null; }
      }));
      products.push(...batch.filter(Boolean));
    }
    if (!products.length) throw new Error('No products with public name and price metadata were found');
    cached = { products, source: 'public-site-read-only' };
    cachedAt = Date.now();
    return cached;
  })();
  try { return await inFlight; } finally { inFlight = null; }
}
