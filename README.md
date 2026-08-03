# rendo

Finn varen i butikken – ikke bare i butikken.

rendo er en mobil-først webapp: søk opp en butikk, få opp planen i 2D eller 3D,
søk etter en vare, se nøyaktig hvor den står (gang, reolseksjon, hylle og høyde),
og trykk **Vis veien** for å få en rute fra der du står.

## Kom i gang

```bash
npm install
npm run dev
```

- `npm run dev` – utviklingsserver
- `npm run build` – typesjekk + produksjonsbygg
- `npm run typecheck` – bare typesjekk

## Slik henger det sammen

```
src/
  data/            Domenemodell og datakilder
    types.ts       Butikk, plan, reolseksjon, planogram
    source.ts      Grensesnittet appen snakker med
    mockSource.ts  Demo-implementasjonen
    nordicBim.ts   Adapter mot Nordic BIM Retail Solution (stubb)
    mock/          Demo-butikk «Rendo Torg» og vareutvalg
  lib/
    search.ts      Vektet søk med norsk normalisering (æøå)
    geometry.ts    Reolfronter, plukkpunkter, avstand og gangtid
    pathfinding.ts Rutenett + A* med svingekostnad
    directions.ts  Rutepolylinje → steg-for-steg-instruksjoner
  components/
    HomePage.tsx   Butikksøk
    StorePage.tsx  Butikkside: søk, kart, panel, ruteflyt
    Map2D.tsx      Plantegning i SVG med panorering, zoom og pinch
    Map3D.tsx      3D-modell (three.js), lastes først ved behov
    ProductPanel.tsx
```

### Data

Nordic BIM Retail Solution har ingen offentlig dokumentert API i dag. Appen er
derfor bygget rundt `RetailDataSource` i [src/data/source.ts](src/data/source.ts):
alt UI går gjennom dette grensesnittet, og `mockSource` fyller det med en
realistisk demo-butikk.

Når vi får tilgang – enten et REST-endepunkt mot Retail Web Viewer, eller eksport
av IFC/glTF fra Archicad pluss planogram som JSON – er det bare oversettelsen inn
til typene i `types.ts` som må skrives. Byttet gjøres på én linje i
[src/data/index.ts](src/data/index.ts).

Tre ting trengs fra kilden:

| Rendo | Nordic BIM |
| --- | --- |
| `Store` | Butikkregisteret i Retail Web Viewer |
| `StorePlan` | Geometri fra Smart BIM Objects: reoler, kasser, innganger |
| `Product.placement` | Planogram-modulen: seksjon, hylle, fronter |

### Ruting

Planen rasteriseres til et rutenett på 25 cm. A* kjører med retningen som del av
tilstanden og en kostnad per sving, slik at ruten legger seg langs gangene med få,
lange strekk i stedet for å skjære diagonalt over gulvet. Ruten ender i gangen
foran reolen, ikke inne i hylla.

### Stil

Hvitt, monokromt og sterilt: kun sort, hvitt og grått, tynne streker, små
radier og ingen dekorfarger. 3D-visningen er en hvit arkitektmodell – ruten og
den valgte varen er det eneste som er sort.
