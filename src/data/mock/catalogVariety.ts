import type { CatalogItem } from './catalog';

/** Bruksvareutvalget hos Europris. */
export const VARIETY_CATALOG: CatalogItem[] = [
  // Kjøkken
  { name: 'Stekepanne 28 cm', brand: 'Cerve', price: 199.0, unit: 'stk', dept: 'kjokken', keywords: ['panne', 'stekepanne'] },
  { name: 'Kasserolle 2 l', brand: 'Cerve', price: 149.0, unit: 'stk', dept: 'kjokken', keywords: ['gryte'] },
  { name: 'Kjøkkenkniv 20 cm', brand: 'Nordic', price: 89.0, unit: 'stk', dept: 'kjokken', keywords: ['kniv'] },
  { name: 'Skjærefjøl bambus', brand: 'Nordic', price: 69.0, unit: 'stk', dept: 'kjokken', keywords: ['fjøl'] },
  { name: 'Glass 4 pk', brand: 'Cerve', price: 79.0, unit: 'pk', dept: 'kjokken', keywords: ['glass', 'drikkeglass'] },
  { name: 'Tallerken 6 pk', brand: 'Cerve', price: 149.0, unit: 'pk', dept: 'kjokken', keywords: ['servise'] },

  // Interiør
  { name: 'Duftlys vanilje', brand: 'Home', price: 49.0, unit: 'stk', dept: 'interior', keywords: ['lys', 'stearinlys'] },
  { name: 'Pledd 130 × 170', brand: 'Home', price: 199.0, unit: 'stk', dept: 'interior', keywords: ['teppe'] },
  { name: 'Pyntepute 45 × 45', brand: 'Home', price: 99.0, unit: 'stk', dept: 'interior', keywords: ['pute'] },
  { name: 'Bilderamme A4', brand: 'Home', price: 79.0, unit: 'stk', dept: 'interior', keywords: ['ramme'] },
  { name: 'Kunstig plante 40 cm', brand: 'Home', price: 149.0, unit: 'stk', dept: 'interior', keywords: ['plante'] },

  // Oppbevaring
  { name: 'Oppbevaringsboks 30 l', brand: 'Orthex', price: 129.0, unit: 'stk', dept: 'oppbevaring', keywords: ['boks', 'kasse'] },
  { name: 'Matboks 3 pk', brand: 'Orthex', price: 89.0, unit: 'pk', dept: 'oppbevaring', keywords: ['boks', 'matpakke'] },
  { name: 'Kleshenger 10 pk', brand: 'Home', price: 59.0, unit: 'pk', dept: 'oppbevaring', keywords: ['henger'] },
  { name: 'Vakuumpose 2 pk', brand: 'Home', price: 99.0, unit: 'pk', dept: 'oppbevaring', keywords: ['pose'] },

  // Rengjøring
  { name: 'Vaskemiddel 2 l', brand: 'Omo', price: 99.0, unit: 'stk', dept: 'rengjoring', keywords: ['klesvask'] },
  { name: 'Universalrengjøring 750 ml', brand: 'Ajax', price: 44.9, unit: 'stk', dept: 'rengjoring', keywords: ['rengjøring', 'såpe'] },
  { name: 'Mikrofiberklut 5 pk', brand: 'Home', price: 59.0, unit: 'pk', dept: 'rengjoring', keywords: ['klut'] },
  { name: 'Moppesett', brand: 'Home', price: 179.0, unit: 'stk', dept: 'rengjoring', keywords: ['mopp', 'gulvvask'] },
  { name: 'Søppelsekker 30 stk', brand: 'Home', price: 69.0, unit: 'pk', dept: 'rengjoring', keywords: ['sekk'] },
  { name: 'Toalettpapir 12 pk', brand: 'Lambi', price: 129.0, unit: 'pk', dept: 'rengjoring', keywords: ['papir', 'do'] },

  // Personlig pleie
  { name: 'Shampoo 400 ml', brand: 'Head & Shoulders', price: 69.0, unit: 'stk', dept: 'personlig', keywords: ['hår'] },
  { name: 'Tannbørste 4 pk', brand: 'Jordan', price: 79.0, unit: 'pk', dept: 'personlig', keywords: ['tenner'] },
  { name: 'Tannkrem 2 pk', brand: 'Colgate', price: 59.0, unit: 'pk', dept: 'personlig', keywords: ['tenner'] },
  { name: 'Håndsåpe 500 ml', brand: 'Dove', price: 49.0, unit: 'stk', dept: 'personlig', keywords: ['såpe'] },
  { name: 'Barberblad 8 pk', brand: 'Gillette', price: 199.0, unit: 'pk', dept: 'personlig', keywords: ['barbering'] },

  // Snacks & drikke
  { name: 'Potetgull 300 g', brand: 'Maarud', price: 39.9, unit: 'pk', dept: 'godteri', keywords: ['chips', 'snacks'] },
  { name: 'Sjokolade 200 g', brand: 'Freia', price: 39.9, unit: 'stk', dept: 'godteri', keywords: ['sjokolade', 'godteri'] },
  { name: 'Cola 1,5 l', brand: 'Coca-Cola', price: 32.9, unit: 'stk', dept: 'godteri', keywords: ['brus'] },
  { name: 'Kaffe 500 g', brand: 'Friele', price: 74.9, unit: 'pk', dept: 'godteri', keywords: ['kaffe'] },
  { name: 'Smågodt 400 g', brand: 'Nidar', price: 59.0, unit: 'pk', dept: 'godteri', keywords: ['godteri'] },

  // Dyr
  { name: 'Hundefôr 10 kg', brand: 'Pedigree', price: 299.0, unit: 'pk', dept: 'dyr', keywords: ['hund'] },
  { name: 'Kattemat 24 pk', brand: 'Whiskas', price: 199.0, unit: 'pk', dept: 'dyr', keywords: ['katt'] },
  { name: 'Kattesand 15 l', brand: 'Catsan', price: 169.0, unit: 'pk', dept: 'dyr', keywords: ['katt'] },
  { name: 'Hundebånd 2 m', brand: 'Pet', price: 99.0, unit: 'stk', dept: 'dyr', keywords: ['hund', 'bånd'] },

  // Hage & uteliv
  { name: 'Hagesaks', brand: 'Fiskars', price: 179.0, unit: 'stk', dept: 'hage', keywords: ['saks', 'beskjæring'] },
  { name: 'Blomsterpotte 25 cm', brand: 'Home', price: 79.0, unit: 'stk', dept: 'hage', keywords: ['potte'] },
  { name: 'Plantejord 20 l', brand: 'Hageland', price: 89.0, unit: 'pk', dept: 'hage', keywords: ['jord'] },
  { name: 'Grillkull 5 kg', brand: 'Weber', price: 149.0, unit: 'pk', dept: 'hage', keywords: ['grill', 'kull'] },
  { name: 'Campingstol', brand: 'Outdoor', price: 249.0, unit: 'stk', dept: 'hage', keywords: ['stol', 'camping'] },

  // Sesong
  { name: 'Julelys 100 LED', brand: 'Home', price: 149.0, unit: 'stk', dept: 'sesong', keywords: ['jul', 'lys'] },
  { name: 'Gavepapir 3 rull', brand: 'Home', price: 69.0, unit: 'pk', dept: 'sesong', keywords: ['gave', 'papir'] },
  { name: 'Ballonger 20 pk', brand: 'Party', price: 49.0, unit: 'pk', dept: 'sesong', keywords: ['fest', 'bursdag'] },

  // Leker & fritid
  { name: 'Byggeklosser 500 deler', brand: 'Brix', price: 249.0, unit: 'pk', dept: 'leker', keywords: ['leke', 'klosser'] },
  { name: 'Kortstokk 2 pk', brand: 'Play', price: 49.0, unit: 'pk', dept: 'leker', keywords: ['kort', 'spill'] },
  { name: 'Fotball str. 5', brand: 'Sport', price: 149.0, unit: 'stk', dept: 'leker', keywords: ['ball', 'fotball'] },
  { name: 'Puslespill 1000 brikker', brand: 'Play', price: 129.0, unit: 'stk', dept: 'leker', keywords: ['spill'] },

  // Kontor & hobby
  { name: 'Kulepenn 10 pk', brand: 'Bic', price: 59.0, unit: 'pk', dept: 'kontor', keywords: ['penn', 'skriv'] },
  { name: 'Notatbok A5', brand: 'Paper', price: 39.0, unit: 'stk', dept: 'kontor', keywords: ['bok', 'skriv'] },
  { name: 'Kopipapir 500 ark', brand: 'Paper', price: 89.0, unit: 'pk', dept: 'kontor', keywords: ['papir', 'printer'] },
  { name: 'Tape 3 pk', brand: 'Home', price: 45.0, unit: 'pk', dept: 'kontor', keywords: ['teip'] },

  // Elektro & lys
  { name: 'Batterier AA 10 pk', brand: 'Duracell', price: 129.0, unit: 'pk', dept: 'elektro', keywords: ['batteri'] },
  { name: 'LED-pære E27', brand: 'Osram', price: 59.0, unit: 'stk', dept: 'elektro', keywords: ['pære', 'lys'] },
  { name: 'Skjøteledning 5 m', brand: 'Elko', price: 149.0, unit: 'stk', dept: 'elektro', keywords: ['ledning', 'strøm'] },
  { name: 'USB-C-kabel 2 m', brand: 'Tech', price: 99.0, unit: 'stk', dept: 'elektro', keywords: ['kabel', 'lader'] },
  { name: 'Hodelykt 200 lumen', brand: 'Outdoor', price: 179.0, unit: 'stk', dept: 'elektro', keywords: ['lykt', 'lys'] },

  // Tekstil
  { name: 'Håndkle 50 × 100', brand: 'Home', price: 79.0, unit: 'stk', dept: 'tekstil', keywords: ['håndkle'] },
  { name: 'Sengesett 140 × 200', brand: 'Home', price: 249.0, unit: 'sett', dept: 'tekstil', keywords: ['seng', 'dyne'] },
  { name: 'Sokker 5 pk', brand: 'Basic', price: 99.0, unit: 'pk', dept: 'tekstil', keywords: ['sokker'] },
  { name: 'Vaskeklut 6 pk', brand: 'Home', price: 59.0, unit: 'pk', dept: 'tekstil', keywords: ['klut'] },

  // Verktøy
  { name: 'Skrutrekkersett 12 deler', brand: 'Fixa', price: 199.0, unit: 'sett', dept: 'verktoy', keywords: ['skrutrekker', 'verktøy'] },
  { name: 'Hammer 500 g', brand: 'Fixa', price: 129.0, unit: 'stk', dept: 'verktoy', keywords: ['hammer'] },
  { name: 'Målebånd 5 m', brand: 'Fixa', price: 79.0, unit: 'stk', dept: 'verktoy', keywords: ['måle'] },
  { name: 'Malerrulle sett', brand: 'Fixa', price: 149.0, unit: 'sett', dept: 'verktoy', keywords: ['maling', 'rulle'] },
  { name: 'Arbeidshansker', brand: 'Fixa', price: 69.0, unit: 'par', dept: 'verktoy', keywords: ['hansker'] },
];
