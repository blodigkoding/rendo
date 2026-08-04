# rendo

Finn varen i butikken – ikke bare butikken.

rendo er en iPhone-app: velg butikk, søk opp en vare, se nøyaktig hvor den står
(gang, reolseksjon, hylle og høyde), og få veien dit fra der du står. Har du
flere varer, legger appen én rute innom alle sammen.

Demoen har seks butikker: **REMA 1000 Ås**, **Coop Extra Ås**, **Europris Ås**,
**JYSK Vinterbro**, **Clas Ohlson Ski** og **Biltema Vestby** – hver med sin egen
plan, sitt eget vareutvalg og sin egen farge i toppen. JYSK og Biltema har
vareutlevering – et lager med luke, tegnet som et tildekket rom i kartet.

## Kom i gang

```bash
npm install
npm run dev          # åpne på telefonen via nettverksadressen vite skriver ut
```

- `npm run dev` – utviklingsserver (tilgjengelig på nettverket)
- `npm run build` – typesjekk + produksjonsbygg
- `npm run typecheck` – bare typesjekk

I nettleseren på desktop vises appen i en iPhone 17 (402 × 874 punkter) mot sort
bakgrunn. Under 520 px bredde – altså på en ekte telefon – fyller den skjermen.

## Slik henger det sammen

```
src/
  data/              Domenemodell og datakilder
    types.ts         Kjede, butikk, plan, reolseksjon, planogram
    source.ts        Grensesnittet appen snakker med
    mockSource.ts    Demo-implementasjonen
    nordicBim.ts     Adapter mot Nordic BIM Retail Solution (stubb)
    productImages.ts Kobler produktfoto til varene
    mock/            Kjeder, planoppskrifter, varekataloger
  lib/
    search.ts        Vektet søk med norsk normalisering (æøå)
    geometry.ts      Reolfronter, plukkpunkter, avstand og gangtid
    pathfinding.ts   Rutenett + A* med svingekostnad
    tour.ts          Rute innom flere varer (nærmeste nabo + 2-opt)
    directions.ts    Rutepolylinje → steg-for-steg
    shoppingList.ts  Handlelista, lagret per butikk
    positioning.ts   Hvor kunden er – simulert i dag, innendørs GPS senere
  components/
    DeviceFrame.tsx  iPhone-rammen med statuslinje og home indicator
    HomePage.tsx     Butikkvalg
    StorePage.tsx    Butikkside: søk, kart, ark, ruteflyt
    TabBar.tsx       Fanelinja: Butikker, Plan, Handleliste, Profil
    Map2D.tsx        Plantegning i SVG – pinch, treghet, dobbelttrykk
    Map3D.tsx        3D-modell (three.js), standardvisningen
    BottomSheet.tsx  Draggbart bunnark med tre høyder
```

### Butikkformer

Ekte butikklokaler er ikke rektangler. Hver plan får derfor en yttervegg med
avskårne hjørner og innhugg – se [src/data/mock/outline.ts](src/data/mock/outline.ts).
Formen genereres med en fast generator per butikk, og hvert innhugg prøves mot
alt som allerede står i lokalet, så ingen reol eller kasse havner utenfor veggen.
Polygonet brukes hele veien: ruting sjekker at man er innenfor og langt nok fra
veggen, planen tegner det som gulvflate, og 3D-modellen reiser vegger langs hver
kant.

### Data

Nordic BIM Retail Solution har ingen offentlig dokumentert API i dag. Appen er
derfor bygget rundt `RetailDataSource` i [src/data/source.ts](src/data/source.ts):
alt UI går gjennom dette grensesnittet, og `mockSource` fyller det med tre
realistiske demo-butikker.

Når vi får tilgang – enten et REST-endepunkt mot Retail Web Viewer, eller eksport
av IFC/glTF fra Archicad pluss planogram som JSON – er det bare oversettelsen inn
til typene i `types.ts` som må skrives. Byttet gjøres på én linje i
[src/data/index.ts](src/data/index.ts).

| Rendo | Nordic BIM |
| --- | --- |
| `Store` | Butikkregisteret i Retail Web Viewer |
| `StorePlan` | Geometri fra Smart BIM Objects: reoler, kasser, innganger |
| `Product.placement` | Planogram-modulen: seksjon, hylle, fronter |

### Produktbilder

Vi har ingen fotokilde ennå, så bildene tegnes: emballasjen varen faktisk kommer
i – flaske, kartong, boks, pose, brett, verktøy, tekstil, møbel og ti former til
– med etikett og lokk i en farge som følger avdelingen. Formen velges ut fra
varenavn og avdeling.

Legg ekte foto i [src/assets/produkter/](src/assets/produkter/) med EAN eller
varenavn som filnavn, så brukes de i stedet.

### Byggeklosser

Målene i planene følger norsk butikkinnredning: reolseksjoner på 1,0 m, doble
gondolrader på 1,25 m, ganger på 2,2–2,6 m, kjøledisker 0,9 m dype, frukt og
grønt på lave bord rett innenfor inngangen og frysere som frittstående kummer.
Se [planBuilder.ts](src/data/mock/planBuilder.ts).

### Å finne varen i hylla

Produktkortet sier to ting, og bare to: hvilken hylle varen står på og hvor
høyt, og hvor langt inn i gangen seksjonen er. Reolrader er femten meter lange,
så «seksjon G1-01» hjelper ingen alene – det er meterne inn i gangen, regnet fra
enden nærmest inngangen, som forteller hvor man skal stoppe. Se `shelfPosition`
i [geometry.ts](src/lib/geometry.ts).

Ruten starter ved inngangen. Vi spør ikke hvor kunden står, for det vet man
ikke selv når man står midt i butikken – og går man allerede, starter ruten
der posisjonen er nå.

### Veibeskrivelse og posisjon

Ruten kan spilles av i førsteperson: kameraet står i øyehøyde der kunden er og
ser dit man går. Posisjonen kommer fra en `PositionSource`
([positioning.ts](src/lib/positioning.ts)). I dag er den simulert langs ruten.
Når butikkene får faste punkter innvendig – bluetooth-fyr, UWB eller wifi – er
det bare å bytte inn en annen kilde; resten av appen kjenner bare grensesnittet.

### Ruting

Planen rasteriseres til et rutenett på 25 cm. A* kjører med retningen som del av
tilstanden og en kostnad per sving, så ruten legger seg langs gangene med få,
lange strekk i stedet for å skjære diagonalt over gulvet. Ruten ender i gangen
foran reolen, ikke inne i hylla.

Handleruten er handelsreisendes problem i miniatyr: avstandene måles med
bredde-først-søk fra hvert stopp, rekkefølgen settes med nærmeste nabo og
forbedres med 2-opt. Hukes en vare av underveis, legges resten av ruten på nytt
fra det punktet.

### Merkevare og stil

Grensesnittet er hvitt med matterte glassflater i iOS-stil. Kjedens farge brukes
bare ett sted – topplinja med logoen. Knapper, faner og kartet er sorte og
nøytrale, så fargen aldri konkurrerer med det man leter etter.

Kjedelogoene er ikke med: de er varemerker vi ikke kan hente selv. Appen tegner
et navnetrekk i stedet. Legg offisielle filer i
[src/assets/logoer/](src/assets/logoer/) med kjede-id som filnavn, så brukes de.

Adressene i Ås er plassholdere. Clas Ohlson Ski og Biltema Vestby er lagt inn med
de stedene kjedene faktisk har butikk i området – sjekk gatenummer mot kjedenes
egen butikkoversikt før dette vises fram.

### Etiketter

All tekst i kartet tegnes i skjermplanet, ikke i selve kartet. Da har navnene
alltid samme størrelse, de flyter ikke når man zoomer, og etiketter som ville
lagt seg oppå hverandre skjules – i 3D vinner den som er nærmest kameraet.
