# Koppeling Kringloop 2.0 / JouwWeb — onderzoek en vervolgstap

## Wat is vastgesteld

- De website laadt afbeeldingen vanaf `primary.jwwb.nl`; dit is een sterke aanwijzing dat de site op JouwWeb draait.
- JouwWeb-documentatie bevestigt dat producten in de Editor onder **Webshop → Producten** naam, beschrijving, afbeeldingen, prijs, actieprijs en voorraad kunnen bevatten. De voorraad wordt na een bestelling automatisch bijgewerkt.
- De openbare webshop toont productdetailpagina's met titel, prijs en artikelnummer.
- In de geraadpleegde openbare documentatie is geen officiële product-API of productfeed gevonden. JouwWeb documenteert wél een online feed voor bestellingen; dat is niet hetzelfde als een productfeed.

## Veilig plan

1. Vraag JouwWeb-support of er voor dit account een ondersteunde productcatalogus-API/feed of export beschikbaar is. Vraag specifiek om product-ID, titel, omschrijving, categorie, hoofdafbeelding, actuele prijs, publicatiestatus en voorraad/beschikbaarheid.
2. Gebruik bij voorkeur die ondersteunde bron. Vul `integration/backend/provider.js` dan aan met de officiële mapping.
3. Als er geen productfeed bestaat, kan de beheerder eerst expliciet toestemming geven voor een beperkte, alleen-lezen pilot die openbare productpagina's leest. De huidige adapter is daarvoor gebouwd, maar staat standaard UIT.
4. De pilot haalt alleen productpagina's van het eigen domein op, leest sitemap/robots.txt, beperkt het aantal pagina's en de gelijktijdige verzoeken, cachet de catalogus en geeft geen voorraadbelofte tenzij de bron expliciet `InStock`/`OutOfStock` vermeldt.
5. Laat winkelwagen, reservering, betaling, klantaccounts en shoptegoed op de bestaande JouwWeb-webshop werken totdat de leverancier een ondersteunde orderkoppeling bevestigt.

## Backend configureren

In `integration/backend/.env` (niet in de mobiele app):

```env
CATALOG_SOURCE=public-site
PUBLIC_CATALOG_CRAWLER_ALLOWED=true
CATALOG_CACHE_SECONDS=900
MAX_PRODUCTS_PER_SYNC=250
ALLOWED_ORIGINS=https://www.kringloop20gorinchem.nl
PORT=8080
```

Zet `PUBLIC_CATALOG_CRAWLER_ALLOWED=true` pas nadat de sitebeheerder akkoord heeft gegeven en de voorwaarden/robots-richtlijnen zijn gecontroleerd. Dit is een tijdelijke publieke-pagina-adapter, geen officiële JouwWeb-API; HTML-structuur kan veranderen. Voor productie verdient een ondersteunde feed de voorkeur.

Installeer en start de backend:

```bash
cd integration/backend
npm install
npm start
```

De app gebruikt vervolgens alleen de eigen HTTPS-backend via `EXPO_PUBLIC_CATALOG_API_URL`. Zet geen geheimen in `EXPO_PUBLIC_*`-variabelen.

## Voorraad en checkout

- Een tweedehands artikel kan uniek zijn en ondertussen verkocht raken. Als de pagina geen expliciete voorraadstatus bevat, toont de app **VOORRAAD CHECKEN**.
- De lokale app-winkelwagen is alleen een favorieten-/selectielijst en reserveert niets.
- Laat klanten voor aankoop naar de officiële productpagina gaan. De definitieve voorraadcontrole en bestelling gebeuren daar.
- Schakel echte in-app bestellingen pas in als er een door JouwWeb ondersteunde manier is om voorraad te controleren en orders aan te maken.

## Bronverwijzingen

- JouwWeb: producten toevoegen, afbeeldingen, prijzen en voorraad: https://help.jouwweb.nl/hc/nl/articles/28594306874897-Producten-toevoegen-aan-je-webshop
- JouwWeb: webshopinstellingen en voorraadbeheer: https://help.jouwweb.nl/hc/nl/articles/28594280000145-Webshop-instellingen-configureren
- Officiële webshop: https://www.kringloop20gorinchem.nl/
- Voorbeeld openbare productpagina: https://www.kringloop20gorinchem.nl/product/23958750/metalen-bord-drink-coffee
