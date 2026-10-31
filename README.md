# Kringloop 2.0 Gorinchem — native app prototype

This is an Expo / React Native starter prototype for Android and iOS.

## Included in the prototype
- Modern, green-and-cream visual identity
- Browse and search sample products
- Category filters
- Local favourites
- Local cart with quantity controls and indicative subtotal
- Account/shop-credit screen (placeholder only)
- Contact/inbreng screen with links to official website
- Notification preference toggle (UI only)
- Links to the official webshop for live catalogue and checkout

## Important limitations
This is a prototype, not yet a production commerce app:
- Product names/prices in `App.js` are sample content and can become outdated.
- The cart does not reserve stock and does not place an order.
- Checkout opens the existing website.
- No passwords, customer records, or real shop-credit balance are stored.
- The notification toggle does not register for push notifications.
- The contact form does not submit; it links to the official contact form.

## Run locally
1. Install Node.js LTS on your computer.
2. Extract this ZIP.
3. In the project folder run:
   ```bash
   npm install
   npx expo start
   ```
4. Install Expo Go on your phone and scan the QR code, or run on an emulator.
5. For native store builds, configure Apple/Google developer accounts and build with EAS Build.

## What is needed for full integration
1. **Commerce API:** Confirm the website platform and available API/webhooks. Ideally expose product IDs, live price, photos, categories, availability, and stock.
2. **Backend:** Build a secure API that mediates between the app and webshop. Do not put private API keys in the mobile app.
3. **Checkout and payments:** Keep checkout hosted by the current commerce platform or integrate its approved payment provider (for example via hosted checkout). Never handle card data directly in the app.
4. **Customer accounts:** Use the webshop's supported authentication/OAuth/API flow. Avoid a second, disconnected account database.
5. **Shop credit:** Read the authoritative balance and apply credit only through server-side rules after confirmed payment/refund events.
6. **Push notifications:** Add Expo Notifications or native APNs/FCM, collect consent, and trigger messages from a backend when products are published.
7. **Contact/inbreng:** Connect a secure form endpoint with spam protection and privacy notice, or keep the official website form.
8. **Privacy and compliance:** Add privacy policy, consent flows, data-retention rules, account deletion/export, accessibility checks, and Dutch consumer-law review.
9. **Testing and release:** Test stock races, payment cancellations, refunds, delivery/pickup options, accessibility, Android/iOS devices, and app-store requirements.

## Next step built: live catalog integration seam
The app now has a read-only catalog client (`catalogService.js`). When `EXPO_PUBLIC_CATALOG_API_URL` points to your own HTTPS API, it requests `/v1/catalog/products`, validates product fields, and displays supplied image URLs. The app shows a status label and can refresh by pulling down or tapping the refresh symbol. If no API is configured, it clearly labels the current catalogue as examples; it does not claim that sample stock is real.

An API starter is in `integration/backend/`. It has security headers, rate limiting, a minimal public catalog route, and a deliberately unconfigured provider adapter. This is intentional: research found public product detail pages (with names, prices and article numbers), but no confirmed documented provider API or reliable stock field. The starter will return a safe 503 until the official connector is implemented; it will not invent availability.

Read `integration/catalog-api-contract.md` for the exact JSON contract and security rules. Before turning on live data, confirm with the website administrator/provider:
1. Which webshop platform/provider is used and what supported API/export exists.
2. Whether product IDs, photo URLs, current price, category, sale status and stock are available.
3. Whether a supported order/cart API exists. Until confirmed, checkout stays on the official webshop.

### Enable the app's read-only catalog client
1. Deploy the backend over HTTPS after implementing `integration/backend/provider.js` with the provider-approved API.
2. Set `EXPO_PUBLIC_CATALOG_API_URL=https://your-api-domain` in the Expo build environment.
3. Rebuild the app. Never add provider secrets to `EXPO_PUBLIC_*` variables.
4. Verify the returned prices and photo URLs against the official site and test sold-out items before release.

## Research update: JouwWeb and the next catalog step
The public site appears to use JouwWeb (its page assets use `primary.jwwb.nl`). JouwWeb's official help confirms product records can contain images, prices, and inventory, with stock updated after orders. In the public documentation checked, a supported product API/feed was not confirmed; an order feed is not a product feed.

A read-only public-page adapter is included in `integration/backend/provider.js`. It is **disabled by default** and only suitable for a limited pilot after the site owner approves it. It reads public sitemap/product pages, extracts title/price/photo metadata where available, caches results, and leaves stock as `unknown` unless the page explicitly exposes a stock status. Prefer a JouwWeb-supported feed/export if support confirms one.

Read `integration/JOUWWEB_SETUP.md` for the setup steps and official source links. Before deployment, ask JouwWeb support whether this account has an approved product feed/export or API. If the site owner approves the public-page pilot, deploy the backend over HTTPS and configure its server environment as described in that guide. Keep `PUBLIC_CATALOG_CRAWLER_ALLOWED=false` until permission and site rules are checked. Set `EXPO_PUBLIC_CATALOG_API_URL` in the Expo build environment; never place provider secrets in `EXPO_PUBLIC_*` variables.

Keep final cart, reservation, checkout, payment, customer accounts, and shop credit on the official webshop until a supported order/stock integration is confirmed.
