import type { CatalogItem } from './catalog';

/** Dagligvareutvalget. Rema og Extra deler dette, med hver sine priser. */
export const GROCERY_CATALOG: CatalogItem[] = [
  // Frukt & grønt
  { name: 'Bananer', brand: 'Chiquita', price: 24.9, unit: 'kg', dept: 'frukt', keywords: ['frukt'] },
  { name: 'Epler Royal Gala', brand: 'Bama', price: 34.9, unit: 'kg', dept: 'frukt', keywords: ['frukt', 'eple'] },
  { name: 'Agurk', brand: 'Norsk', price: 19.9, unit: 'stk', dept: 'frukt', keywords: ['grønnsak'] },
  { name: 'Tomater i klase', brand: 'Bama', price: 39.9, unit: 'kg', dept: 'frukt', keywords: ['grønnsak'] },
  { name: 'Poteter mandel', brand: 'Norsk', price: 29.9, unit: 'kg', dept: 'frukt', keywords: ['grønnsak', 'potet'] },
  { name: 'Gulrot 1 kg', brand: 'Bama', price: 22.9, unit: 'pk', dept: 'frukt', keywords: ['grønnsak'] },
  { name: 'Avokado', brand: 'Bama', price: 16.9, unit: 'stk', dept: 'frukt', keywords: ['frukt'] },

  // Bakeri & brød
  { name: 'Grovbrød hel', brand: 'Bakeriet', price: 39.9, unit: 'stk', dept: 'bakeri', keywords: ['brød'] },
  { name: 'Loff', brand: 'Bakeriet', price: 32.9, unit: 'stk', dept: 'bakeri', keywords: ['brød'] },
  { name: 'Rundstykker 6 pk', brand: 'Bakeriet', price: 34.9, unit: 'pk', dept: 'bakeri', keywords: ['brød'] },
  { name: 'Croissant 4 pk', brand: 'Bakeriet', price: 44.9, unit: 'pk', dept: 'bakeri', keywords: ['bakverk'] },
  { name: 'Kanelboller 4 pk', brand: 'Bakeriet', price: 49.9, unit: 'pk', dept: 'bakeri', keywords: ['bakverk', 'bolle'] },

  // Meieri
  { name: 'Helmelk 1 l', brand: 'Tine', price: 21.9, unit: 'l', dept: 'meieri', keywords: ['melk'] },
  { name: 'Lettmelk 1 l', brand: 'Tine', price: 21.5, unit: 'l', dept: 'meieri', keywords: ['melk'] },
  { name: 'Kremfløte 3 dl', brand: 'Tine', price: 29.9, unit: 'stk', dept: 'meieri', keywords: ['fløte'] },
  { name: 'Smør 500 g', brand: 'Tine', price: 64.9, unit: 'pk', dept: 'meieri', keywords: ['meieri'] },
  { name: 'Brunost Gudbrandsdalen', brand: 'Tine', price: 54.9, unit: 'stk', dept: 'meieri', keywords: ['ost'] },
  { name: 'Jarlsberg skivet', brand: 'Tine', price: 49.9, unit: 'pk', dept: 'meieri', keywords: ['ost'] },
  { name: 'Yoghurt naturell', brand: 'Tine', price: 27.9, unit: 'stk', dept: 'meieri', keywords: ['yoghurt'] },
  { name: 'Egg 12 stk', brand: 'Prior', price: 59.9, unit: 'pk', dept: 'meieri', keywords: ['egg'] },

  // Kjøtt & fisk
  { name: 'Kyllingfilet 800 g', brand: 'Prior', price: 129.0, unit: 'pk', dept: 'kjott', keywords: ['kylling', 'kjøtt'] },
  { name: 'Kjøttdeig 400 g', brand: 'Gilde', price: 69.9, unit: 'pk', dept: 'kjott', keywords: ['kjøtt', 'karbonade'] },
  { name: 'Svinekoteletter', brand: 'Gilde', price: 89.9, unit: 'pk', dept: 'kjott', keywords: ['kjøtt', 'svin'] },
  { name: 'Laksefilet 400 g', brand: 'Salma', price: 149.0, unit: 'pk', dept: 'kjott', keywords: ['fisk', 'laks'] },
  { name: 'Bacon i skiver', brand: 'Gilde', price: 44.9, unit: 'pk', dept: 'kjott', keywords: ['kjøtt'] },

  // Frys
  { name: 'Frossenpizza Grandiosa', brand: 'Stabburet', price: 74.9, unit: 'stk', dept: 'frys', keywords: ['pizza', 'frossen'] },
  { name: 'Fiskepinner 450 g', brand: 'Findus', price: 69.9, unit: 'pk', dept: 'frys', keywords: ['fisk', 'frossen'] },
  { name: 'Pommes frites 1 kg', brand: 'Findus', price: 44.9, unit: 'pk', dept: 'frys', keywords: ['frossen', 'potet'] },
  { name: 'Iskrem vanilje 1 l', brand: 'Diplom-Is', price: 59.9, unit: 'stk', dept: 'frys', keywords: ['is', 'dessert'] },
  { name: 'Frosne bringebær', brand: 'Bama', price: 49.9, unit: 'pk', dept: 'frys', keywords: ['bær', 'frossen'] },

  // Drikke
  { name: 'Farris naturell 1,5 l', brand: 'Ringnes', price: 26.9, unit: 'stk', dept: 'drikke', keywords: ['vann', 'mineralvann'] },
  { name: 'Coca-Cola Zero 1,5 l', brand: 'Coca-Cola', price: 34.9, unit: 'stk', dept: 'drikke', keywords: ['brus', 'cola'] },
  { name: 'Solo 1,5 l', brand: 'Ringnes', price: 33.9, unit: 'stk', dept: 'drikke', keywords: ['brus'] },
  { name: 'Appelsinjuice 1 l', brand: 'Tine', price: 32.9, unit: 'l', dept: 'drikke', keywords: ['juice'] },
  { name: 'Eplemost 1 l', brand: 'Lerum', price: 39.9, unit: 'l', dept: 'drikke', keywords: ['juice', 'most'] },
  { name: 'Energidrikk 0,5 l', brand: 'Red Bull', price: 29.9, unit: 'stk', dept: 'drikke', keywords: ['energi'] },

  // Tørrvarer
  { name: 'Spaghetti 500 g', brand: 'Barilla', price: 24.9, unit: 'pk', dept: 'torrvarer', keywords: ['pasta'] },
  { name: 'Penne 500 g', brand: 'Barilla', price: 24.9, unit: 'pk', dept: 'torrvarer', keywords: ['pasta'] },
  { name: 'Jasminris 1 kg', brand: 'Uncle Bens', price: 44.9, unit: 'pk', dept: 'torrvarer', keywords: ['ris'] },
  { name: 'Hvetemel 2 kg', brand: 'Møllerens', price: 32.9, unit: 'pk', dept: 'torrvarer', keywords: ['mel', 'baking'] },
  { name: 'Sukker 1 kg', brand: 'Dan Sukker', price: 27.9, unit: 'pk', dept: 'torrvarer', keywords: ['baking'] },
  { name: 'Filterkaffe 500 g', brand: 'Friele', price: 79.9, unit: 'pk', dept: 'torrvarer', keywords: ['kaffe'] },
  { name: 'Te Earl Grey 20 pk', brand: 'Twinings', price: 42.9, unit: 'pk', dept: 'torrvarer', keywords: ['te'] },
  { name: 'Olivenolje 500 ml', brand: 'Zeta', price: 89.9, unit: 'stk', dept: 'torrvarer', keywords: ['olje'] },
  { name: 'Tacolefser 8 stk', brand: 'Old El Paso', price: 34.9, unit: 'pk', dept: 'torrvarer', keywords: ['taco'] },

  // Hermetikk & saus
  { name: 'Hakkede tomater', brand: 'Mutti', price: 18.9, unit: 'stk', dept: 'hermetikk', keywords: ['tomat', 'boks'] },
  { name: 'Tomatpuré 200 g', brand: 'Mutti', price: 21.9, unit: 'stk', dept: 'hermetikk', keywords: ['tomat'] },
  { name: 'Kokosmelk 400 ml', brand: 'Santa Maria', price: 24.9, unit: 'stk', dept: 'hermetikk', keywords: ['kokos'] },
  { name: 'Tunfisk i vann', brand: 'Rieber', price: 26.9, unit: 'stk', dept: 'hermetikk', keywords: ['fisk', 'boks'] },
  { name: 'Ketchup 500 g', brand: 'Heinz', price: 34.9, unit: 'stk', dept: 'hermetikk', keywords: ['saus'] },
  { name: 'Majones 160 g', brand: 'Mills', price: 29.9, unit: 'stk', dept: 'hermetikk', keywords: ['saus'] },

  // Frokost & pålegg
  { name: 'Cornflakes 500 g', brand: 'Kellogg’s', price: 44.9, unit: 'pk', dept: 'frokost', keywords: ['frokostblanding'] },
  { name: 'Havregryn 1 kg', brand: 'Axa', price: 32.9, unit: 'pk', dept: 'frokost', keywords: ['havre', 'grøt'] },
  { name: 'Jordbærsyltetøy', brand: 'Nora', price: 39.9, unit: 'stk', dept: 'frokost', keywords: ['syltetøy'] },
  { name: 'Peanøttsmør 350 g', brand: 'Sunda', price: 49.9, unit: 'stk', dept: 'frokost', keywords: ['pålegg'] },
  { name: 'Leverpostei 190 g', brand: 'Mills', price: 27.9, unit: 'stk', dept: 'frokost', keywords: ['pålegg'] },
  { name: 'Kaviar 185 g', brand: 'Mills', price: 42.9, unit: 'stk', dept: 'frokost', keywords: ['pålegg'] },

  // Snacks & godteri
  { name: 'Potetgull 300 g', brand: 'Maarud', price: 44.9, unit: 'pk', dept: 'snacks', keywords: ['chips', 'snacks'] },
  { name: 'Saltstenger 250 g', brand: 'Maarud', price: 29.9, unit: 'pk', dept: 'snacks', keywords: ['snacks'] },
  { name: 'Melkesjokolade 200 g', brand: 'Freia', price: 44.9, unit: 'stk', dept: 'snacks', keywords: ['sjokolade', 'godteri'] },
  { name: 'Seigmenn 200 g', brand: 'Nidar', price: 39.9, unit: 'pk', dept: 'snacks', keywords: ['godteri'] },
  { name: 'Popcorn til mikro', brand: 'Estrella', price: 24.9, unit: 'pk', dept: 'snacks', keywords: ['snacks'] },

  // Husholdning
  { name: 'Oppvasksåpe 500 ml', brand: 'Zalo', price: 39.9, unit: 'stk', dept: 'husholdning', keywords: ['rengjøring'] },
  { name: 'Tørkerull 2 pk', brand: 'Lambi', price: 42.9, unit: 'pk', dept: 'husholdning', keywords: ['papir'] },
  { name: 'Toalettpapir 9 pk', brand: 'Lambi', price: 79.9, unit: 'pk', dept: 'husholdning', keywords: ['papir', 'do'] },
  { name: 'Søppelsekker 20 stk', brand: 'Toro', price: 49.9, unit: 'pk', dept: 'husholdning', keywords: ['sekk'] },
  { name: 'Vaskemiddel 1 l', brand: 'Omo', price: 89.9, unit: 'stk', dept: 'husholdning', keywords: ['vask', 'klesvask'] },

  // Hygiene & apotek
  { name: 'Tannkrem 75 ml', brand: 'Colgate', price: 34.9, unit: 'stk', dept: 'hygiene', keywords: ['tenner'] },
  { name: 'Shampoo 250 ml', brand: 'Head & Shoulders', price: 59.9, unit: 'stk', dept: 'hygiene', keywords: ['hår'] },
  { name: 'Dusjsåpe 250 ml', brand: 'Dove', price: 44.9, unit: 'stk', dept: 'hygiene', keywords: ['såpe'] },
  { name: 'Deodorant 150 ml', brand: 'Rexona', price: 49.9, unit: 'stk', dept: 'hygiene', keywords: [] },
  { name: 'Plaster 20 stk', brand: 'Salvequick', price: 59.9, unit: 'pk', dept: 'hygiene', keywords: ['apotek', 'sår'] },

  // Baby
  { name: 'Bleier str. 4', brand: 'Pampers', price: 129.0, unit: 'pk', dept: 'baby', keywords: ['baby'] },
  { name: 'Våtservietter 3 pk', brand: 'Pampers', price: 59.9, unit: 'pk', dept: 'baby', keywords: ['baby'] },
  { name: 'Barnegrøt 400 g', brand: 'Nestlé', price: 44.9, unit: 'pk', dept: 'baby', keywords: ['baby', 'grøt'] },

  // Dyr & fritid
  { name: 'Hundefôr 3 kg', brand: 'Pedigree', price: 149.0, unit: 'pk', dept: 'dyr', keywords: ['hund'] },
  { name: 'Kattemat 12 pk', brand: 'Whiskas', price: 119.0, unit: 'pk', dept: 'dyr', keywords: ['katt'] },
  { name: 'Kattesand 10 l', brand: 'Catsan', price: 139.0, unit: 'pk', dept: 'dyr', keywords: ['katt'] },
];
