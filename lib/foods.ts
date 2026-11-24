// Roza-Safe food table. Copied from our build report (Part 1), with sources for every number.
// All carbs = AVAILABLE carbohydrate (fibre excluded). GI scale: glucose = 100.
// estimated = true means no measured value exists; the reasoning is in `src`.
// FCTB = Food Composition Table for Bangladesh, Shaheen N et al., INFS Univ. of Dhaka / FAO, 2013.
// ATK08 = Atkinson FS, Foster-Powell K, Brand-Miller JC. Diabetes Care 2008;31:2281-3, Table 1.
// TODO (team): weigh 5-10 pieces of each fried snack and replace the estimated portion weights.

export type Unit = "piece" | "cup" | "bowl" | "glass";

export type Food = {
  id: string;
  nameBn: string;
  nameEn: string;
  unit: Unit;
  portion: number; // size of ONE unit
  portionUnit: "g" | "ml";
  carbsPerUnit: number; // g available carbohydrate
  gi: number; // glucose = 100 (0 = almost no carbohydrate)
  fiberPerUnit: number; // g
  proteinPerUnit: number; // g
  estimated: boolean; // true if GI and/or composition is an estimate
  src: string;
};

export const FOODS: Food[] = [
  // ---------- IFTAR ----------
  { id: "khejur", nameBn: "খেজুর", nameEn: "Dates", unit: "piece", portion: 8, portionUnit: "g",
    carbsPerUnit: 5.4, gi: 49, fiberPerUnit: 0.6, proteinPerUnit: 0.2, estimated: false,
    src: "Comp: USDA SR Legacy 'Dates, deglet noor' FDC 171726 (75.03 g CHO, 8.0 g fibre, 2.45 g protein /100 g; avail 67.0 g) x 8 g. GI: Alkaabi JM et al. Nutr J 2011;10:59, Table 4 - mean of 5 varieties in T2D (46.1, 43.8, 51.8, 50.2, 53.0) = 49. ATK08 'Dates, raw' 42±4 for comparison." },

  { id: "jilapi", nameBn: "জিলাপি", nameEn: "Jilapi (jalebi)", unit: "piece", portion: 40, portionUnit: "g",
    carbsPerUnit: 18, gi: 70, fiberPerUnit: 0.3, proteinPerUnit: 1.2, estimated: true,
    src: "ESTIMATE. Comp: ~12 g maida dough solids (FCTB 01_0032 maida: 73.1 g CHO, 2.7 g fibre, 9.8 g protein /100 g) + ~10 g sugar syrup solids + ~6 g oil; cross-check: IFCT-2017-based recipe calc 44.6 g CHO/100 g (clearcals.com) -> 17.8 g per 40 g. GI: no peer-reviewed measurement exists (not in Henry 2021 compendium of 940 non-Western foods). Estimated 70 = between sucrose 65 (ATK08) and white wheat bread 75 (ATK08), its two carb sources." },

  { id: "beguni", nameBn: "বেগুনি", nameEn: "Beguni (battered fried eggplant)", unit: "piece", portion: 30, portionUnit: "g",
    carbsPerUnit: 6.0, gi: 40, fiberPerUnit: 0.7, proteinPerUnit: 2.3, estimated: true,
    src: "ESTIMATE. Recipe: 15 g brinjal (FCTB 03_0005: 2.0 CHO, 4.1 fibre, 1.9 prot /100 g) + 10 g besan (FCTB 02_0001 Bengal gram split: 59.2 CHO, 1.2 fibre, 20.2 prot) + 5 g oil. GI: no measurement; besan-based fried foods test low (besan chapatti GI 27 in T2D, Foster-Powell 2002 AJCN table item 682; urad-dal vada 21.5, Henry 2021 #686). Rounded conservatively to 40." },

  { id: "piyaju", nameBn: "পিঁয়াজু", nameEn: "Piyaju (lentil-onion fritter)", unit: "piece", portion: 20, portionUnit: "g",
    carbsPerUnit: 4.5, gi: 35, fiberPerUnit: 1.2, proteinPerUnit: 2.3, estimated: true,
    src: "ESTIMATE. Recipe: 8 g dry masoor (FCTB 02_0008: 43.2 CHO, 13.2 fibre, 27.7 prot) + 8 g onion (FCTB 03_0024: 12.2 CHO, 1.9 fibre, 1.4 prot) + ~4 g oil. GI: no measurement; lentils 32±5 (ATK08) raised slightly for onion/frying-batter -> 35." },

  { id: "alur_chop", nameBn: "আলুর চপ", nameEn: "Alur chop (potato chop)", unit: "piece", portion: 60, portionUnit: "g",
    carbsPerUnit: 12.3, gi: 65, fiberPerUnit: 1.1, proteinPerUnit: 2.6, estimated: true,
    src: "ESTIMATE. Recipe: 45 g boiled potato (FCTB 05_0012: 14.2 CHO, 2.1 fibre, 1.2 prot) + 10 g besan (FCTB 02_0001) + 5 g oil. GI: boiled potato ~78 (ATK08 - verify), lowered for besan coat and fat -> 65." },

  { id: "chola_bhuna", nameBn: "ছোলা ভুনা", nameEn: "Chola bhuna (spiced chickpeas)", unit: "cup", portion: 120, portionUnit: "g",
    carbsPerUnit: 28.0, gi: 28, fiberPerUnit: 10.9, proteinPerUnit: 12.7, estimated: false,
    src: "Comp: FCTB 02_0012 Bengal gram whole boiled (23.3 CHO, 9.1 fibre, 10.6 prot /100 g) x 1.2 (oil/spices ignored). GI: ATK08 'Chickpeas' 28±9; Indian chickpea sundal 24.1±2.6 (Shobana S et al. Indian J Med Res 2022;155:56, Table III)." },

  { id: "muri", nameBn: "মুড়ি", nameEn: "Muri (puffed rice)", unit: "bowl", portion: 30, portionUnit: "g",
    carbsPerUnit: 24.8, gi: 87, fiberPerUnit: 0.4, proteinPerUnit: 2.0, estimated: true,
    src: "Comp: FCTB 01_0023 Rice, puffed, salted (82.7 CHO, 1.4 fibre, 6.7 prot /100 g) x 30 g. GI ESTIMATE: no measured muri GI; proxy ATK08 'Rice crackers/crisps' 87 (puffed rice product). Muri makha with chola/onion will be lower." },

  { id: "haleem", nameBn: "হালিম", nameEn: "Haleem", unit: "bowl", portion: 200, portionUnit: "g",
    carbsPerUnit: 30, gi: 42, fiberPerUnit: 4, proteinPerUnit: 20, estimated: true,
    src: "ESTIMATE. Comp: no FCTB/IFCT entry; assumed ~15 g CHO, ~10 g protein, ~2 g fibre /100 g for a wheat-lentil-meat stew. GI proxy: harees (wheat+meat porridge) 42±2, Al Dhaheri 2017 Br J Nutr 117:1110 via Henry 2021 #884." },

  { id: "dimer_chop", nameBn: "ডিমের চপ", nameEn: "Dimer chop (egg chop)", unit: "piece", portion: 90, portionUnit: "g",
    carbsPerUnit: 10, gi: 60, fiberPerUnit: 1.0, proteinPerUnit: 7.0, estimated: true,
    src: "ESTIMATE. Recipe: 1/2-1 boiled egg (~50 g) + 40 g potato mash (FCTB 05_0021: 16.6 CHO, 2.5 fibre, 1.4 prot) + breadcrumb coat. GI: no measurement; potato-dominant carb, fat/egg lowers -> 60." },

  { id: "samosa", nameBn: "সমুচা", nameEn: "Samosa (maida pastry)", unit: "piece", portion: 50, portionUnit: "g",
    carbsPerUnit: 15, gi: 60, fiberPerUnit: 1.0, proteinPerUnit: 3.0, estimated: true,
    src: "ESTIMATE. Comp: ~15 g maida (FCTB 01_0032) + vegetable/keema filling + oil. GI proxy: 'Sambosa, vegetable' 60.35±5.11 (Ali 2020, Oman; Henry 2021 compendium #906)." },

  { id: "singara", nameBn: "সিঙ্গারা", nameEn: "Singara (potato-filled)", unit: "piece", portion: 40, portionUnit: "g",
    carbsPerUnit: 12, gi: 60, fiberPerUnit: 0.9, proteinPerUnit: 2.0, estimated: true,
    src: "ESTIMATE. Recipe: 12 g maida (FCTB 01_0032) + 20 g potato (FCTB 05_0012) + oil. GI proxy as samosa (Henry 2021 #906, 60)." },

  { id: "pakora", nameBn: "পাকোড়া", nameEn: "Pakora (vegetable-besan fritter)", unit: "piece", portion: 20, portionUnit: "g",
    carbsPerUnit: 5, gi: 40, fiberPerUnit: 0.5, proteinPerUnit: 1.7, estimated: true,
    src: "ESTIMATE. Recipe: 8 g besan (FCTB 02_0001) + vegetables + oil. GI: no measurement; same reasoning as beguni -> 40." },

  { id: "fruit_chaat", nameBn: "ফলের চাট", nameEn: "Fruit chaat", unit: "cup", portion: 150, portionUnit: "g",
    carbsPerUnit: 18, gi: 50, fiberPerUnit: 2.5, proteinPerUnit: 1.0, estimated: true,
    src: "ESTIMATE. Mixed apple/banana/papaya/guava ~12 g avail CHO/100 g (USDA fruit entries below). GI: weighted mix of apple 36, banana 51, papaya 59, watermelon 76 (ATK08) -> ~50. Excludes added sugar." },

  { id: "banana", nameBn: "কলা", nameEn: "Banana", unit: "piece", portion: 100, portionUnit: "g",
    carbsPerUnit: 20.2, gi: 51, fiberPerUnit: 2.6, proteinPerUnit: 1.1, estimated: false,
    src: "Comp: USDA SR Legacy 'Bananas, raw' FDC 173944 (22.84 CHO, 2.6 fibre, 1.09 prot /100 g) - verify; edible portion 100 g (typical sagor kola). GI: ATK08 'Banana, raw' 51±3." },

  { id: "watermelon", nameBn: "তরমুজ", nameEn: "Watermelon", unit: "cup", portion: 150, portionUnit: "g",
    carbsPerUnit: 10.7, gi: 76, fiberPerUnit: 0.6, proteinPerUnit: 0.9, estimated: false,
    src: "Comp: USDA SR Legacy 'Watermelon, raw' FDC 167765 (7.55 CHO, 0.4 fibre, 0.61 prot /100 g) - verify. GI: ATK08 'Watermelon, raw' 76±4." },

  { id: "papaya", nameBn: "পেঁপে", nameEn: "Papaya (ripe)", unit: "cup", portion: 145, portionUnit: "g",
    carbsPerUnit: 13.2, gi: 59, fiberPerUnit: 2.5, proteinPerUnit: 0.7, estimated: false,
    src: "Comp: USDA SR Legacy 'Papayas, raw' FDC 169926 (10.82 CHO, 1.7 fibre, 0.47 prot /100 g) - verify. GI: 59 (Sydney GI database / 2002 international table mean) - verify; not in ATK08 Table 1." },

  { id: "apple", nameBn: "আপেল", nameEn: "Apple", unit: "piece", portion: 180, portionUnit: "g",
    carbsPerUnit: 20.5, gi: 36, fiberPerUnit: 4.3, proteinPerUnit: 0.5, estimated: false,
    src: "Comp: USDA SR Legacy 'Apples, raw, with skin' FDC 171688 (13.81 CHO, 2.4 fibre, 0.26 prot /100 g) - verify. GI: ATK08 'Apple, raw' 36±2." },

  { id: "rooh_afza_sharbat", nameBn: "রুহ আফজা শরবত", nameEn: "Rooh Afza / sweet sharbat", unit: "glass", portion: 250, portionUnit: "ml",
    carbsPerUnit: 31.2, gi: 65, fiberPerUnit: 0, proteinPerUnit: 0.1, estimated: true,
    src: "Comp: Hamdard Sharbat Rooh Afza label (myhamdardstore.com): 103.92 g carbohydrate, 101.6 g sugars, 0.44 g protein per 100 ml syrup; ASSUMED 30 ml syrup per 250 ml glass. GI: no measurement; proxy sucrose 65±4 (ATK08)." },

  { id: "lemon_water", nameBn: "চিনি ছাড়া লেবুর শরবত", nameEn: "Lemon water (no sugar)", unit: "glass", portion: 250, portionUnit: "ml",
    carbsPerUnit: 1, gi: 0, fiberPerUnit: 0, proteinPerUnit: 0, estimated: true,
    src: "ESTIMATE: ~15 ml lemon juice ≈ 1 g carbohydrate; glycaemic effect negligible (gi set 0)." },

  { id: "lassi_sweet", nameBn: "মিষ্টি লাচ্ছি", nameEn: "Sweet lassi", unit: "glass", portion: 250, portionUnit: "ml",
    carbsPerUnit: 29, gi: 56, fiberPerUnit: 0, proteinPerUnit: 6.9, estimated: true,
    src: "ESTIMATE. Recipe: 200 g whole-milk yogurt (USDA FDC 171284: 4.66 CHO, 3.47 prot /100 g) + ~20 g sugar. GI: no measurement; carb-weighted yogurt (~41, ATK08 'Yogurt, fruit') and sucrose 65 -> 56." },

  { id: "doi_mishti", nameBn: "মিষ্টি দই", nameEn: "Mishti doi (sweet yogurt)", unit: "cup", portion: 100, portionUnit: "g",
    carbsPerUnit: 20, gi: 50, fiberPerUnit: 0, proteinPerUnit: 3.5, estimated: true,
    src: "ESTIMATE. ~4.7 g lactose (USDA FDC 171284) + ~15 g added sugar per 100 g. GI: no measurement; between yogurt 41 and sucrose 65 (ATK08) -> 50." },

  { id: "doi_plain", nameBn: "টক দই", nameEn: "Plain yogurt (doi)", unit: "cup", portion: 100, portionUnit: "g",
    carbsPerUnit: 4.7, gi: 41, fiberPerUnit: 0, proteinPerUnit: 3.5, estimated: false,
    src: "Comp: USDA SR Legacy 'Yogurt, plain, whole milk' FDC 171284 - verify. GI proxy: ATK08 'Yogurt, fruit' 41±2 (plain is likely lower; conservative)." },

  { id: "payesh", nameBn: "পায়েস / ফিরনি", nameEn: "Payesh / firni (rice pudding)", unit: "bowl", portion: 125, portionUnit: "g",
    carbsPerUnit: 27.5, gi: 57, fiberPerUnit: 0.3, proteinPerUnit: 4.5, estimated: true,
    src: "ESTIMATE ~22 g CHO/100 g; REPLACE with FCTB recipe 12_0013 'Payesh' values. GI proxy: Lebanese rice-milk pudding 56.83±7.35 (Daher 2010; Henry 2021 #938)." },

  { id: "cake", nameBn: "কেক / পেস্ট্রি", nameEn: "Cake / pastry", unit: "piece", portion: 60, portionUnit: "g",
    carbsPerUnit: 30, gi: 50, fiberPerUnit: 0.5, proteinPerUnit: 3, estimated: true,
    src: "ESTIMATE ~50 g CHO/100 g; GI estimate 50 (no Bangladeshi cake measured). Use package label where available." },

  // ---------- SEHRI / MEALS ----------
  { id: "white_rice", nameBn: "সাদা ভাত", nameEn: "White rice, cooked", unit: "cup", portion: 160, portionUnit: "g",
    carbsPerUnit: 39.7, gi: 73, fiberPerUnit: 1.6, proteinPerUnit: 3.4, estimated: false,
    src: "Comp: FCTB 01_0041 Rice, white, polished, boiled (24.8 CHO, 1.0 fibre, 2.1 prot /100 g) x 1.6. GI: ATK08 'White rice, boiled' 73±4 (default). Bangladeshi varieties measured 44.6-59.7 (Kabir E et al. J Gizi Pangan 2021;16:31) and BRRI dhan28 75.7 (BRRI dataset 2024) - offer variety picker." },

  { id: "brown_rice", nameBn: "লাল চালের ভাত", nameEn: "Brown/red rice, cooked", unit: "cup", portion: 160, portionUnit: "g",
    carbsPerUnit: 37.1, gi: 68, fiberPerUnit: 1.9, proteinPerUnit: 4.0, estimated: false,
    src: "Comp: FCTB 01_0039 Rice, brown, parboiled, milled, boiled (23.2 CHO, 1.2 fibre, 2.5 prot /100 g) x 1.6. GI: ATK08 'Brown rice, boiled' 68±4." },

  { id: "ruti", nameBn: "রুটি", nameEn: "Ruti (chapati)", unit: "piece", portion: 40, portionUnit: "g",
    carbsPerUnit: 19.9, gi: 52, fiberPerUnit: 1.2, proteinPerUnit: 3.0, estimated: false,
    src: "Comp: FCTB 01_0042 Ruti (49.7 CHO, 3.1 fibre, 7.5 prot /100 g) x 40 g. GI: ATK08 'Chapatti' 52±4; Indian whole-wheat roti 45.1 (Radhika G et al. Br J Nutr 2010)." },

  { id: "paratha", nameBn: "পরোটা", nameEn: "Paratha", unit: "piece", portion: 80, portionUnit: "g",
    carbsPerUnit: 33.9, gi: 60, fiberPerUnit: 2.4, proteinPerUnit: 5.6, estimated: true,
    src: "Comp: avail CHO 42.38 g/100 g (methi paratha, Shobana 2022 IJMR Table I) x 80 g; fibre/protein ESTIMATED from FCTB ruti scaled. GI: methi paratha 60.2±6.7 SEM (Shobana 2022, Table III)." },

  { id: "dal", nameBn: "ডাল", nameEn: "Dal (masoor, thin)", unit: "bowl", portion: 150, portionUnit: "g",
    carbsPerUnit: 15.9, gi: 32, fiberPerUnit: 4.9, proteinPerUnit: 10.2, estimated: true,
    src: "Comp: FCTB 02_0015 Lentil boiled (21.2 CHO, 6.5 fibre, 13.6 prot /100 g); ASSUMED Bangladeshi patla dal = 50% boiled lentil -> 75 g equivalent. GI: no measured masoor-dal GI; ATK08 'Lentils' 32±5 (verify)." },

  { id: "fish_curry", nameBn: "মাছের তরকারি", nameEn: "Fish curry (1 piece + gravy)", unit: "piece", portion: 100, portionUnit: "g",
    carbsPerUnit: 2, gi: 0, fiberPerUnit: 0.3, proteinPerUnit: 15, estimated: true,
    src: "ESTIMATE; replace protein with FCTB 09_0060 Rohu (fish chapter). Carbohydrate negligible (onion/spice gravy)." },

  { id: "chicken_curry", nameBn: "মুরগির তরকারি", nameEn: "Chicken curry (1 serving)", unit: "piece", portion: 100, portionUnit: "g",
    carbsPerUnit: 3, gi: 0, fiberPerUnit: 0.5, proteinPerUnit: 18, estimated: true,
    src: "ESTIMATE; replace with FCTB 10_0006/10_0007 chicken values. Carbohydrate negligible." },

  { id: "egg", nameBn: "ডিম সেদ্ধ", nameEn: "Egg, boiled", unit: "piece", portion: 50, portionUnit: "g",
    carbsPerUnit: 0.4, gi: 0, fiberPerUnit: 0, proteinPerUnit: 6.3, estimated: false,
    src: "Comp: USDA SR Legacy 'Egg, whole, raw' FDC 171287 (12.56 prot /100 g) - verify; FCTB 11_0005 egg boiled also available. No meaningful carbohydrate." },

  { id: "omelette", nameBn: "ডিম ভাজি / অমলেট", nameEn: "Omelette (1 egg, with onion & chilli)", unit: "piece", portion: 65, portionUnit: "g",
    carbsPerUnit: 1.3, gi: 0, fiberPerUnit: 0.2, proteinPerUnit: 6.5, estimated: true,
    src: "ESTIMATE. Recipe: 1 egg (~50 g; USDA FDC 171287: 0.4 CHO, 6.3 prot) + ~10 g onion (~0.9 CHO, 0.2 fibre) + green chilli, fried in ~5 g oil. Carbohydrate negligible, so GI is not applied (same as boiled egg)." },

  { id: "shobji", nameBn: "সবজি", nameEn: "Mixed vegetable curry", unit: "bowl", portion: 150, portionUnit: "g",
    carbsPerUnit: 10, gi: 50, fiberPerUnit: 4, proteinPerUnit: 3, estimated: true,
    src: "ESTIMATE: potato (FCTB 05_0012), pumpkin (03_0028), brinjal (03_0005), gourds; GI 50 assumes some potato." },

  { id: "milk", nameBn: "দুধ", nameEn: "Milk, whole", unit: "glass", portion: 250, portionUnit: "ml",
    carbsPerUnit: 12.0, gi: 39, fiberPerUnit: 0, proteinPerUnit: 7.9, estimated: false,
    src: "Comp: USDA SR Legacy 'Milk, whole, 3.25%' FDC 171265 (4.80 CHO, 3.15 prot /100 g) - verify; FCTB 12_0008 also available. GI: ATK08 'Milk, full fat' 39±3." },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

// Bangla word for each unit, for labels like "১৮g প্রতি পিস".
export const unitBn: Record<Unit, string> = { piece: "পিস", cup: "কাপ", bowl: "বাটি", glass: "গ্লাস" };
