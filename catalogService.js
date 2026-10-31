/**
 * Read-only catalog client. The app never talks to the commerce platform with
 * private credentials. Configure EXPO_PUBLIC_CATALOG_API_URL to your own HTTPS
 * backend after the webshop provider confirms an approved integration.
 */
export const CATALOG_API_URL = (process.env.EXPO_PUBLIC_CATALOG_API_URL || '').replace(/\/$/, '');
export const CATALOG_API_CONFIGURED = Boolean(CATALOG_API_URL);

function normalizeProduct(raw) {
  if (!raw || raw.id == null || !raw.name || typeof raw.price !== 'number') return null;
  const url = typeof raw.url === 'string' && raw.url.startsWith('https://www.kringloop20gorinchem.nl/')
    ? raw.url : 'https://www.kringloop20gorinchem.nl/webshop';
  const imageUrl = typeof raw.imageUrl === 'string' && raw.imageUrl.startsWith('https://') ? raw.imageUrl : null;
  return {
    id: String(raw.id),
    name: String(raw.name).slice(0, 180),
    category: String(raw.category || 'Overig').slice(0, 60),
    price: raw.price,
    note: String(raw.note || 'Bekijk de officiële webshop voor details').slice(0, 200),
    icon: '♻️',
    url,
    imageUrl,
    availability: raw.availability === 'in_stock' ? 'in_stock' : 'unknown',
    stockCheckedAt: raw.stockCheckedAt || null,
    source: 'live',
  };
}

export async function fetchLiveCatalog() {
  if (!CATALOG_API_URL) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${CATALOG_API_URL}/v1/catalog/products`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Catalogusserver antwoordde met ${response.status}`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.products)) throw new Error('Ongeldig catalogusformaat');
    return payload.products.map(normalizeProduct).filter(Boolean);
  } finally {
    clearTimeout(timeout);
  }
}
