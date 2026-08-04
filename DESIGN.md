# rendo — designsystem

Dette er rendos eget system. Det er inspirert av hvordan IKEA har bygget **Skapa**:
én kilde til sannhet, moduler som kan gjenbrukes, tilgjengelighet som utgangspunkt
i stedet for etterarbeid, og et språk som er det samme uansett om du er i appen,
på nett eller foran en skjerm i butikken.

Vi har ikke lånt IKEAs farger eller typografi — det ville gjort rendo til en
IKEA-app. Vi har lånt arbeidsmåten: få byggeklosser, tydelige regler, og et
uttrykk som lar innholdet være hovedsaken.

---

## 1. Prinsipper

**Varen er hovedsaken.** Alt annet er ramme. Kartet er hvitt, grensesnittet er
gjennomsiktig, og det eneste som er sort er det du leter etter og veien dit.

**Ett svar, ikke fem tall.** Et produktkort skal ikke ramse opp avdeling, gang,
seksjon, hylle og lager. Det skal si hvor du skal gå og hvor du skal se.

**Butikken skal kjennes igjen.** Modellen har butikkens faktiske form, med de
målene norsk butikkinnredning faktisk har. Kjenner du ikke igjen butikken i
kartet, er kartet feil.

**Kjeden er en gjest.** Kjedens farge har nøyaktig ett sted: topplinja med
logoen. Knapper, faner og kart er sorte og nøytrale. Unntaket er kjedens egne
tjenester — Skann og Betal-knappen bærer kjedens farge, fordi den fører deg inn
i kjedens app.

**Rolig i bevegelse.** Kartet hopper aldri. Har du flyttet det selv, står det.

---

## 2. Farger

Grensesnittet er hvitt med sort tekst. Fargene er delt i tre roller.

### Grensesnitt

| Rolle | Verdi | Brukes til |
| --- | --- | --- |
| `--bg` | `#ffffff` | Flater |
| `--surface` / `--surface-2` | `#fafafa` / `#f2f2f3` | Felt, hvilende knapper |
| `--ink` | `#0b0b0c` | Tekst, knapper, aktiv fane |
| `--ink-2` | `#56565b` | Brødtekst under overskrift |
| `--ink-3` | `#8e8e94` | Etiketter, metadata |
| `--line` / `--line-strong` | `#e7e7e9` / `#d0d0d4` | Skiller, rammer |

### Kart og modell

| Rolle | Verdi | Brukes til |
| --- | --- | --- |
| `--backdrop` | `#f1f0ec` | Flaten rundt butikken |
| `--floor` | `#ffffff` | Gulvplaten |
| `--shelf` | `#e9e6df` | Tørrvarereoler |
| `--cold` | `#dde5e7` | Kjøl og frys — kjølig og metallisk |
| `--wood` | `#c9a97b` | Benkeplater, hyllekanter, treverk |
| `--sage` | `#8fa389` | Detalj: inngang, planter |
| `--map-ink` | `#2f3a34` | Rute, valgt vare, skrift i kartet |

Salviegrønn er en detalj, aldri en bakgrunn.

### Kjede

Hver kjede har `accent` og `onAccent`. De settes som `--chain` på butikksiden og
brukes kun i topplinja og i kjedens egne tjenesteknapper.

---

## 3. Typografi

Systemfonten, fordi appen skal kjennes som en del av telefonen.

| Rolle | Størrelse | Vekt | Sporing |
| --- | --- | --- | --- |
| Sidetittel | 22 px | 500 | −0,03 em |
| Korttittel | 17 px | 500 | −0,02 em |
| Brødtekst | 15 px | 400 | −0,01 em |
| Sekundær | 13,5 px | 400 | — |
| Etikett (`.meta`) | 10 px | 400 | ~0 |

**Ingen versaler.** Store bokstaver som stilgrep leses tregere og roper. Vi
skriver som folk skriver. Merkevarenavn som skrives med store bokstaver — REMA
1000, JYSK — er navn, ikke stil.

Sporingen er negativ på store størrelser og nøytral på små. Det er den samme
regelen Apple bruker, og den gjør at store tall og korte overskrifter ikke faller
fra hverandre.

---

## 4. Rom

Åtte-punktsskala: **4, 8, 12, 16, 20, 24, 32**.

- Sideluft i lister og kort: 16 px
- Mellom kort i et rutenett: 12 px
- Mellom seksjoner: 18–24 px
- Trykkeflater: aldri under 44 × 44 px. Pluss-knappen for å legge i lista er
  48 × 48 px, fordi det er den handlingen som gjentas mest.

---

## 5. Form

Maks avrunding. Alt som kan bli kapsel, blir kapsel.

| Token | Verdi | Brukes til |
| --- | --- | --- |
| `--round` | `999px` | Knapper, søkefelt, chips, faner |
| `--round-lg` | `30px` | Bunnark |
| `--round-md` | `22px` | Kort, kontrollgrupper |

Rammen rundt telefonen har 54 px radius, som iPhone 17.

---

## 6. Glass

Grensesnittet ligger som matterte glassflater over kartet. Dette er ikke pynt:
det er slik du ser at kartet fortsetter under arket, og at fanelinja flyter over
butikken i stedet for å kutte den.

```css
background: rgba(255, 255, 255, 0.28);   /* verktøylinjer */
background: rgba(255, 255, 255, 0.72);   /* ark og overlegg, som må leses */
backdrop-filter: saturate(200%) blur(34px);
border: 1px solid rgba(255, 255, 255, 0.42);
box-shadow:
  0 10px 34px rgba(18, 22, 19, 0.16),
  inset 0 1px 0 rgba(255, 255, 255, 0.65);
```

Regelen: **jo mer tekst en flate bærer, jo tettere er glasset.** En verktøylinje
kan være nesten gjennomsiktig. Et ark man skal lese i, kan ikke det.

Metningen på 200 % er det som gjør at glass ser ut som glass og ikke som en grå
plate — fargene under blir sterkere, ikke svakere.

---

## 7. Komponenter

**Knapp.** Kapsel, 46 px høy, sort fyll med hvit tekst. Sekundær er samme form
med ramme og sort tekst. Kjedens tjenesteknapp er samme form i kjedens farge.

**Kort.** Glass, 22 px radius, 12 px mellomrom. Butikkort viser en isometrisk
tegning av butikken, kjedens navnetrekk, navn og avstand.

**Bunnark.** Flyter over kartet med runde hjørner hele veien rundt, over
fanelinja. Tre høyder man drar mellom: 27 %, 56 %, 90 % av scenen.

**Fanelinje.** Flyter 14 px fra kanten, kapselform, glass. Fire faner:
Butikker, Plan, Handleliste, Profil. Aktiv fane er sort — aldri kjedefarget.

**Liste.** Rad med bilde (46 px), navn, sekundærlinje og handling til høyre.

**Etiketter i kartet.** Tegnes i skjermplanet, ikke i kartet. De har fast
størrelse uansett zoom, og etiketter som kolliderer skjules — den nærmest
kameraet vinner.

---

## 8. Bevegelse

| Hva | Varighet | Kurve |
| --- | --- | --- |
| Trykk | 120 ms | `ease` |
| Ark og faner | 300 ms | `cubic-bezier(0.3, 0.8, 0.3, 1)` |
| Kartutsnitt | 460 ms | `easeOutCubic`, zoom logaritmisk |
| Kamera i 3D | følger bildefrekvens | lerp, stopper når det står stille |

Panorering har treghet. Zoom interpoleres logaritmisk — ellers føles den ujevn
i endene.

---

## 9. Språk

Norsk, small caps finnes ikke, og vi skriver som vi snakker.

- «Gå 11 m inn i gang 1» — ikke «Seksjon G1-01»
- «50 cm over gulv, i kjøledisken» — ikke «Høyde: 50»
- «Lista er tom» — ikke «Ingen elementer funnet»

Tall får norsk komma (`37,50`), avstander avrundes til én desimal under ti meter
og til hele meter over.

---

## 10. Tilgjengelighet

- Kontrast: sort på hvitt er 19:1. Sekundærtekst `--ink-3` på hvitt er 4,6:1 og
  brukes aldri til noe man må lese for å komme videre.
- Alle trykkeflater har `aria-label` når de bare har et ikon.
- Fanelinja bruker `aria-current`, brytere `role="switch"` og `aria-checked`.
- Kartet er dekorativt for skjermleser; all informasjon i kartet finnes også som
  tekst i arket.
- Ingenting formidles med farge alene. Valgt vare er sort *og* har markør *og*
  står i teksten.

---

## Kilder til inspirasjon

- [Skapa — IKEAs designsystem](https://skapa.ikea.net/)
- [Skapa for Android](https://android.skapa.ikea.net/)
- [Into Design Systems: IKEA Skapa](https://www.intodesignsystems.com/use-cases/ikea-design-system)
