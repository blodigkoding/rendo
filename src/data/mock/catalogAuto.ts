import type { CatalogItem } from './catalog';

/**
 * Biltemas utvalg, sortert etter kjedens åtte forretningsområder:
 * Bil & MC, Bilpleie, Verktøy, Bygg, Båt, Fritid, Hjem og Kontor & multimedia.
 */
export const AUTO_CATALOG: CatalogItem[] = [
  // Bilpleie
  { name: 'Bilshampoo 1 l', brand: 'Biltema', price: 79.0, unit: 'stk', dept: 'bilpleie', keywords: ['vask', 'bil'] },
  { name: 'Frostvæske 4 l', brand: 'Biltema', price: 149.0, unit: 'pk', dept: 'bilpleie', keywords: ['spylervæske', 'vinter'] },
  { name: 'Mikrofiberklut 10 pk', brand: 'Biltema', price: 99.0, unit: 'pk', dept: 'bilpleie', keywords: ['klut', 'puss'] },
  { name: 'Isskrape med kost', brand: 'Biltema', price: 69.0, unit: 'stk', dept: 'bilpleie', keywords: ['vinter', 'skrape'] },
  { name: 'Polerrondell', brand: 'Biltema', price: 129.0, unit: 'stk', dept: 'bilpleie', keywords: ['polering'] },

  // Bil & MC
  { name: 'Motorolje 5W-30 4 l', brand: 'Biltema', price: 349.0, unit: 'pk', dept: 'bilmc', keywords: ['olje', 'motor'] },
  { name: 'Vindusviskere 60 cm', brand: 'Biltema', price: 149.0, unit: 'stk', dept: 'bilmc', keywords: ['visker', 'rute'] },
  { name: 'Bilbatteri 60 Ah', brand: 'Biltema', price: 1290.0, unit: 'stk', dept: 'bilmc', keywords: ['batteri', 'start'] },
  { name: 'Tennplugg 4 pk', brand: 'Biltema', price: 199.0, unit: 'pk', dept: 'bilmc', keywords: ['motor'] },
  { name: 'Startkabler 400 A', brand: 'Biltema', price: 299.0, unit: 'sett', dept: 'bilmc', keywords: ['start', 'kabel'] },

  // Verktøy
  { name: 'Skrutrekkersett 32 deler', brand: 'Biltema', price: 249.0, unit: 'sett', dept: 'verktoy', keywords: ['skrutrekker'] },
  { name: 'Pipenøkkelsett 1/2"', brand: 'Biltema', price: 599.0, unit: 'sett', dept: 'verktoy', keywords: ['pipe', 'nøkkel'] },
  { name: 'Skiftenøkkel 250 mm', brand: 'Biltema', price: 129.0, unit: 'stk', dept: 'verktoy', keywords: ['nøkkel'] },
  { name: 'Hammer 600 g', brand: 'Biltema', price: 149.0, unit: 'stk', dept: 'verktoy', keywords: ['hammer'] },
  { name: 'Verktøykasse 45 cm', brand: 'Biltema', price: 299.0, unit: 'stk', dept: 'verktoy', keywords: ['kasse'] },
  { name: 'Tommestokk 2 m', brand: 'Biltema', price: 59.0, unit: 'stk', dept: 'verktoy', keywords: ['måle'] },

  // Verktøy – maskiner
  { name: 'Drill 18 V', brand: 'Biltema', price: 899.0, unit: 'stk', dept: 'verktoy', keywords: ['drill', 'batteri'] },
  { name: 'Vinkelsliper 125 mm', brand: 'Biltema', price: 699.0, unit: 'stk', dept: 'verktoy', keywords: ['sliper'] },
  { name: 'Stikksag 600 W', brand: 'Biltema', price: 549.0, unit: 'stk', dept: 'verktoy', keywords: ['sag'] },
  { name: 'Borsett 19 deler', brand: 'Biltema', price: 199.0, unit: 'sett', dept: 'verktoy', keywords: ['bor'] },

  // Bygg
  { name: 'Skruer 5 × 60 mm', brand: 'Biltema', price: 149.0, unit: 'pk', dept: 'bygg', keywords: ['skrue', 'feste'] },
  { name: 'Plugg og skrue 200 pk', brand: 'Biltema', price: 99.0, unit: 'pk', dept: 'bygg', keywords: ['plugg'] },
  { name: 'Silikon fugemasse', brand: 'Biltema', price: 89.0, unit: 'stk', dept: 'bygg', keywords: ['fuge', 'tetting'] },
  { name: 'Presenning 4 × 6 m', brand: 'Biltema', price: 249.0, unit: 'stk', dept: 'bygg', keywords: ['presenning'] },
  { name: 'Malingsrulle sett', brand: 'Biltema', price: 149.0, unit: 'sett', dept: 'bygg', keywords: ['maling'] },

  // Kontor & multimedia
  { name: 'Batterier AA 24 pk', brand: 'Biltema', price: 149.0, unit: 'pk', dept: 'kontor', keywords: ['batteri'] },
  { name: 'LED-arbeidslampe', brand: 'Biltema', price: 399.0, unit: 'stk', dept: 'bygg', keywords: ['lampe', 'lys'] },
  { name: 'Skjøtekabel 25 m', brand: 'Biltema', price: 449.0, unit: 'stk', dept: 'bygg', keywords: ['kabel', 'strøm'] },
  { name: 'Multimeter', brand: 'Biltema', price: 249.0, unit: 'stk', dept: 'kontor', keywords: ['måler'] },

  // Fritid
  { name: 'Sovepose −5 °C', brand: 'Biltema', price: 499.0, unit: 'stk', dept: 'fritid', keywords: ['camping', 'tur'] },
  { name: 'Campingstol', brand: 'Biltema', price: 199.0, unit: 'stk', dept: 'fritid', keywords: ['stol', 'camping'] },
  { name: 'Kjølebag 24 l', brand: 'Biltema', price: 249.0, unit: 'stk', dept: 'fritid', keywords: ['kjøl', 'tur'] },
  { name: 'Hodelykt 300 lumen', brand: 'Biltema', price: 199.0, unit: 'stk', dept: 'fritid', keywords: ['lykt'] },

  // Båt
  { name: 'Redningsvest 50 N', brand: 'Biltema', price: 399.0, unit: 'stk', dept: 'bat', keywords: ['vest', 'sikkerhet'] },
  { name: 'Fortøyningstau 10 m', brand: 'Biltema', price: 199.0, unit: 'stk', dept: 'bat', keywords: ['tau'] },
  { name: 'Bunnstoff 2,5 l', brand: 'Biltema', price: 899.0, unit: 'stk', dept: 'bat', keywords: ['maling', 'båt'] },

  // Hjem
  { name: 'Hageslange 20 m', brand: 'Biltema', price: 299.0, unit: 'stk', dept: 'hjem', keywords: ['slange', 'vann'] },
  { name: 'Løvrive', brand: 'Biltema', price: 129.0, unit: 'stk', dept: 'hjem', keywords: ['rive', 'løv'] },
  { name: 'Grillkull 5 kg', brand: 'Biltema', price: 129.0, unit: 'pk', dept: 'hjem', keywords: ['grill'] },

  // Fritid – sykkel
  { name: 'Sykkelpumpe', brand: 'Biltema', price: 149.0, unit: 'stk', dept: 'fritid', keywords: ['pumpe'] },
  { name: 'Sykkelslange 28"', brand: 'Biltema', price: 79.0, unit: 'stk', dept: 'fritid', keywords: ['slange', 'dekk'] },
  { name: 'Sykkellås', brand: 'Biltema', price: 199.0, unit: 'stk', dept: 'fritid', keywords: ['lås'] },
  { name: 'Sykkellykt sett', brand: 'Biltema', price: 249.0, unit: 'sett', dept: 'fritid', keywords: ['lys'] },

  // Hjem
  { name: 'Oppbevaringsboks 60 l', brand: 'Biltema', price: 149.0, unit: 'stk', dept: 'hjem', keywords: ['boks', 'kasse'] },
  { name: 'LED-pære E27 3 pk', brand: 'Biltema', price: 99.0, unit: 'pk', dept: 'hjem', keywords: ['pære', 'lys'] },
  { name: 'Kjøkkenvekt digital', brand: 'Biltema', price: 179.0, unit: 'stk', dept: 'hjem', keywords: ['vekt', 'kjøkken'] },
  { name: 'Termos 1 l', brand: 'Biltema', price: 249.0, unit: 'stk', dept: 'hjem', keywords: ['termos', 'kaffe'] },

  // Kontor & multimedia
  { name: 'USB-C-kabel 2 m', brand: 'Biltema', price: 99.0, unit: 'stk', dept: 'kontor', keywords: ['kabel', 'lader'] },
  { name: 'Hodetelefoner trådløse', brand: 'Biltema', price: 399.0, unit: 'stk', dept: 'kontor', keywords: ['musikk', 'bluetooth'] },
  { name: 'Kopipapir 500 ark', brand: 'Biltema', price: 89.0, unit: 'pk', dept: 'kontor', keywords: ['papir', 'printer'] },
];
