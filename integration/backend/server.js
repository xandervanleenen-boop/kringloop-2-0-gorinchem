import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getOfficialCatalog } from './provider.js';

const app = express();
const port = Number(process.env.PORT || 8080);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean) }));
app.use(express.json({ limit: '16kb' }));
app.use('/v1/', rateLimit({ windowMs: 60_000, limit: 90, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/v1/catalog/products', async (_req, res) => {
  try {
    const result = await getOfficialCatalog();
    if (!result || !Array.isArray(result.products)) {
      return res.status(503).json({ error: 'catalog_provider_not_configured' });
    }
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.set('X-Catalog-Source', result.source || 'approved-provider');
    res.json({ updatedAt: new Date().toISOString(), products: result.products });
  } catch (error) {
    // Do not return provider errors, credentials, or raw responses to clients.
    console.error('Catalog provider failure:', error?.message || 'unknown');
    res.status(503).json({ error: 'catalog_temporarily_unavailable' });
  }
});

app.listen(port, () => console.log(`Catalog API listening on port ${port}`));
