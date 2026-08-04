import type { CatalogItem } from './catalog';

/** Møbel- og innredningsutvalget hos JYSK. */
export const HOME_CATALOG: CatalogItem[] = [
  // Senger
  { name: 'Rammemadrass 150 × 200', brand: 'Gold', price: 3999.0, unit: 'stk', dept: 'senger', keywords: ['seng', 'madrass'] },
  { name: 'Sengegavl 150 cm', brand: 'Basic', price: 1299.0, unit: 'stk', dept: 'senger', keywords: ['gavl', 'seng'] },
  { name: 'Kontinentalseng 180 × 200', brand: 'Gold', price: 7999.0, unit: 'stk', dept: 'senger', keywords: ['seng'] },
  { name: 'Sengebein 15 cm 4 pk', brand: 'Basic', price: 399.0, unit: 'pk', dept: 'senger', keywords: ['bein', 'seng'] },

  // Madrasser
  { name: 'Skummadrass 90 × 200', brand: 'Plus', price: 1299.0, unit: 'stk', dept: 'madrasser', keywords: ['madrass'] },
  { name: 'Overmadrass 160 × 200', brand: 'Plus', price: 999.0, unit: 'stk', dept: 'madrasser', keywords: ['overmadrass'] },
  { name: 'Madrassbeskytter 90 × 200', brand: 'Basic', price: 299.0, unit: 'stk', dept: 'madrasser', keywords: ['trekk'] },

  // Sengetøy
  { name: 'Sengesett 140 × 200', brand: 'Home', price: 349.0, unit: 'sett', dept: 'sengetoy', keywords: ['dynetrekk', 'seng'] },
  { name: 'Laken 150 × 250', brand: 'Home', price: 199.0, unit: 'stk', dept: 'sengetoy', keywords: ['laken'] },
  { name: 'Putetrekk 2 pk', brand: 'Home', price: 149.0, unit: 'pk', dept: 'sengetoy', keywords: ['pute'] },
  { name: 'Sengeteppe 220 × 240', brand: 'Home', price: 599.0, unit: 'stk', dept: 'sengetoy', keywords: ['teppe', 'seng'] },

  // Dyner & puter
  { name: 'Dyne varm 140 × 200', brand: 'Plus', price: 899.0, unit: 'stk', dept: 'dyner', keywords: ['dyne'] },
  { name: 'Hodepute medium', brand: 'Plus', price: 399.0, unit: 'stk', dept: 'dyner', keywords: ['pute'] },
  { name: 'Barnedyne 100 × 140', brand: 'Basic', price: 449.0, unit: 'stk', dept: 'dyner', keywords: ['dyne', 'barn'] },

  // Møbler
  { name: 'Spisebord 140 × 90', brand: 'Nordic', price: 2499.0, unit: 'stk', dept: 'mobler', keywords: ['bord', 'spisebord'] },
  { name: 'Spisestol eik', brand: 'Nordic', price: 799.0, unit: 'stk', dept: 'mobler', keywords: ['stol'] },
  { name: 'Sofa 3-seter', brand: 'Nordic', price: 5999.0, unit: 'stk', dept: 'mobler', keywords: ['sofa'] },
  { name: 'Salongbord 110 cm', brand: 'Nordic', price: 1299.0, unit: 'stk', dept: 'mobler', keywords: ['bord'] },
  { name: 'Skrivebord 120 cm', brand: 'Nordic', price: 1499.0, unit: 'stk', dept: 'mobler', keywords: ['bord', 'kontor'] },
  { name: 'Kontorstol', brand: 'Nordic', price: 1799.0, unit: 'stk', dept: 'mobler', keywords: ['stol', 'kontor'] },

  // Oppbevaring
  { name: 'Garderobeskap 120 cm', brand: 'Basic', price: 2999.0, unit: 'stk', dept: 'oppbevaring', keywords: ['skap'] },
  { name: 'Kommode 4 skuffer', brand: 'Basic', price: 1699.0, unit: 'stk', dept: 'oppbevaring', keywords: ['kommode', 'skuff'] },
  { name: 'Oppbevaringskasse 45 l', brand: 'Basic', price: 199.0, unit: 'stk', dept: 'oppbevaring', keywords: ['kasse', 'boks'] },
  { name: 'Skohylle 3 nivå', brand: 'Basic', price: 499.0, unit: 'stk', dept: 'oppbevaring', keywords: ['sko', 'hylle'] },

  // Bad
  { name: 'Håndkle 70 × 140', brand: 'Home', price: 199.0, unit: 'stk', dept: 'bad', keywords: ['håndkle'] },
  { name: 'Badematte 50 × 80', brand: 'Home', price: 249.0, unit: 'stk', dept: 'bad', keywords: ['matte'] },
  { name: 'Dusjforheng 180 × 200', brand: 'Home', price: 199.0, unit: 'stk', dept: 'bad', keywords: ['forheng', 'dusj'] },
  { name: 'Badehylle', brand: 'Basic', price: 399.0, unit: 'stk', dept: 'bad', keywords: ['hylle'] },

  // Gardiner
  { name: 'Mørkleggingsgardin 140 × 245', brand: 'Home', price: 449.0, unit: 'stk', dept: 'gardiner', keywords: ['gardin', 'mørklegging'] },
  { name: 'Gardinstang 120–210 cm', brand: 'Basic', price: 199.0, unit: 'stk', dept: 'gardiner', keywords: ['stang'] },
  { name: 'Rullegardin 120 × 170', brand: 'Home', price: 349.0, unit: 'stk', dept: 'gardiner', keywords: ['rullegardin'] },

  // Tepper
  { name: 'Teppe 160 × 230', brand: 'Home', price: 999.0, unit: 'stk', dept: 'tepper', keywords: ['teppe'] },
  { name: 'Dørmatte 45 × 75', brand: 'Basic', price: 149.0, unit: 'stk', dept: 'tepper', keywords: ['matte', 'dør'] },

  // Belysning
  { name: 'Bordlampe', brand: 'Home', price: 399.0, unit: 'stk', dept: 'belysning', keywords: ['lampe', 'lys'] },
  { name: 'Gulvlampe 150 cm', brand: 'Home', price: 799.0, unit: 'stk', dept: 'belysning', keywords: ['lampe'] },
  { name: 'Taklampe', brand: 'Home', price: 599.0, unit: 'stk', dept: 'belysning', keywords: ['lampe', 'tak'] },

  // Utemøbler
  { name: 'Hagestol stablbar', brand: 'Outdoor', price: 499.0, unit: 'stk', dept: 'utemobler', keywords: ['stol', 'hage'] },
  { name: 'Hagebord 150 cm', brand: 'Outdoor', price: 1999.0, unit: 'stk', dept: 'utemobler', keywords: ['bord', 'hage'] },
  { name: 'Parasoll 300 cm', brand: 'Outdoor', price: 899.0, unit: 'stk', dept: 'utemobler', keywords: ['parasoll', 'sol'] },
  { name: 'Putekasse 320 l', brand: 'Outdoor', price: 1299.0, unit: 'stk', dept: 'utemobler', keywords: ['kasse', 'pute'] },

  // Barnerom
  { name: 'Barneseng 70 × 160', brand: 'Basic', price: 1999.0, unit: 'stk', dept: 'barnerom', keywords: ['seng', 'barn'] },
  { name: 'Barnestol', brand: 'Basic', price: 349.0, unit: 'stk', dept: 'barnerom', keywords: ['stol', 'barn'] },
  { name: 'Leketøykasse', brand: 'Basic', price: 449.0, unit: 'stk', dept: 'barnerom', keywords: ['kasse', 'leker'] },
];
