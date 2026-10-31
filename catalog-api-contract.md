# Live cataloguscontract v1

## Endpoint
`GET https://<eigen-api-domein>/v1/catalog/products`

## Response
```json
{
  "updatedAt": "2026-10-24T10:00:00Z",
  "products": [
    {
      "id": "011-9.3-826",
      "name": "Metalen bord 'Drink Coffee'",
      "category": "Wonen",
      "price": 3.5,
      "imageUrl": "https://www.kringloop20gorinchem.nl/...",
      "url": "https://www.kringloop20gorinchem.nl/product/23958750/metalen-bord-drink-coffee",
      "availability": "unknown",
      "stockCheckedAt": null,
      "note": "Retro stijl, met metalen ophang koord"
    }
  ]
}
```

The sample above illustrates the schema using a publicly listed product; the image URL must be read from the live page, not copied from this example.

## Stock semantics
- `in_stock`: only when the current source explicitly confirms availability.
- `out_of_stock`: only when the current source explicitly confirms it.
- `unknown`: default when no authoritative stock signal is available.

## Security
- Keep provider secrets on the backend; never put them in the app or `EXPO_PUBLIC_*` variables.
- HTTPS only, strict origin allowlist, rate limiting, timeouts, and minimal public fields.
- The public-site adapter is optional, read-only, and disabled by default. It is not a documented JouwWeb product API. Prefer a supported feed/export if JouwWeb confirms one.
- Do not return customer records, order data, account information, or shop-credit balances from this endpoint.
- App cart is not a reservation. Keep checkout on the official webshop until a supported order/stock API is confirmed.
