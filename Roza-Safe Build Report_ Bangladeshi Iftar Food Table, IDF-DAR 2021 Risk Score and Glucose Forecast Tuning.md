I've built all three files: `foods.ts`, `dar.ts` and `forecast.ts`. Two results differ from what you expected. On the real IDF-DAR 2021 table, Case B scores **Low** (1.5–2.0), not Moderate. And about a third of the foods, including jilapi, have no published GI, so I've marked those values as estimates. The forecast model behaves as you wanted. The jilapi-heavy plate peaks at about **12.2 mmol/L** and the "with swaps" plate at about **8.2 mmol/L**.

## TL;DR
- **Food table:** 34 foods.
  - **Where the numbers come from:** Carbs, fibre and protein come from the Food Composition Table for Bangladesh (FCTB 2013) wherever it lists the item. Otherwise they come from USDA (fruit, dairy, egg) or from recipe calculations, which are marked estimates. GI values come from the 2008 international GI tables (Atkinson et al.), a 2011 study of dates in people with type 2 diabetes (Alkaabi), Bangladeshi rice studies and an Indian study (Shobana 2022).\[1\]
  - **Missing GIs:** No published GI exists for jilapi, beguni, piyaju, pakora, haleem, mishti doi, lassi or most fried iftar items. Their GIs are marked `estimated: true` and the reasoning is written into each entry.
- **IDF-DAR score:**
  - **Table:** All 14 risk elements and their points are copied from Table 2 (p. 94) of the 2021 guidelines. The bands are Low 0–3, Moderate 3.5–6, High >6.
  - **Cases A and C:** they match. Case A scores 0 (Low) and Case C scores 12–12.5 (High).
  - **Case B:** it scores only 1.5 (gliclazide/glimepiride) or 2.0 (glibenclamide), which is Low. It only reaches Moderate with extra factors, for example not checking blood glucose when a doctor has said to (+2), or 10+ years of diabetes plus another factor.
- **Curve tuning:**
  - **What changed:** I kept k = 0.12 mmol/L per GL unit. I moved the curve's peak from 45 to **75 min**, based on continuous glucose monitor (CGM) data in type 2 diabetes. I cut the protein/fibre dampening from 0.01 to **0.006 per g**, based on a whey-protein trial. I kept the walk factor at **0.85**, in line with the 12–22% reductions from walking in type 2 diabetes.
  - **Results:** jilapi plate 12.2 mmol/L (range 11.2–13.2); swap plate 8.2 mmol/L (range 7.8–8.6). Any k between 0.081 and 0.197 gives the same over/under-10 result.

---

## Key Findings

1. **The IDF-DAR table can be checked word for word.** It is reprinted, with IDF-DAR permission, as Figure 1 of Mehar S, *Journal of Diabetes Nursing* 2024;28:JDN318. The figure is labelled "TABLE 2: ELEMENTS FOR RISK CALCULATION AND SUGGESTED RISK SCORE…", page 94 of the guidelines.\[2\]
   - **Second copy:** the version of Chapter 5 on clinicalpathways.io matches, except for one typo: it lists "DKA/HONC in the last 3 months" twice.\[3\] The JDN reprint correctly has 3 months = 3 points and 6 months = 2.\[2\]
   - **Cut-offs used by validation studies:**
     - A two-centre validation in Riyadh, Saudi Arabia (Cureus, PMC11929123) used "low risk (score 0-3), moderate risk (score 3.5-6), and high risk (score >6)".\[4\]
     - So did the Bangladeshi DAR-BAN study (Kamrul-Hasan et al., *J Clin Transl Endocrinol* 2023;31:100315), which followed 1,328 adults with type 2 diabetes through Ramadan 2022. It concluded that "the new IDF-DAR risk scoring system seems conservative in the risk categorization of T2DM patients in terms of fasting complications."\[5\]\[6\]\[7\]
   - **Main citation:** Hassanein M, Afandi B, Yakoob Ahmedani M, et al. *Diabetes Res Clin Pract* 2022;185:109185.\[8\]\[9\]
2. **Case B does not reach Moderate on its own.** The score is 0 (type 2) + 1 (HbA1c 7.5–9%) + 0.5 or 1 (depending on the sulfonylurea) = 1.5–2.0, which is **Low**.\[2\] Don't force it. In the app, show Case B as "Low, but on a sulfonylurea: talk to your doctor about dose timing".
3. **Bangladesh has its own GI data for rice.**
   - Kabir et al. 2021 measured six rice varieties bought at local markets at GI 44.6–59.7.\[10\]
   - Another study found most popular BRRI varieties are medium GI (56–69), and BRRI dhan28 measured 75.7.\[11\]\[12\]
   - The Bangladesh Rice Research Institute reports that the low-GI BRRI dhan105 has a GI of 55.04, against 73–77 for other white rice (The Business Post, 25 Feb 2023).\[13\]
   - So Bangladeshi rice is *not* uniformly GI 73. The app should default to 73 and offer a rice-variety option.
4. **Dates are low GI in people with type 2 diabetes.** Alkaabi 2011 measured 43.8–53.0 across five varieties in people with type 2 diabetes (mean 49).\[14\]\[15\] A few dates are a reasonable way to open the fast; the fried snacks and sweet sharbat are the real problem.
5. **Your original constants already passed** (jilapi plate 11.5, swap plate 8.1). The tuning below makes each constant *defensible to judges*; it was not needed to force the result.

---

## Part 1 — Food table (`lib/foods.ts`)

### How sources were chosen
- **Carbs, fibre, protein.** Values per 100 g come from FCTB 2013 (Shaheen et al., INFS, University of Dhaka; PDF hosted by FAO) and are cited by FCTB food code. FCTB's "carbohydrate available" figure already excludes fibre. Where FCTB has no entry I used USDA SR Legacy values and give the FDC ID. **Open each FDC ID before submission;** I did not re-check those pages.
- **GI (glucose = 100).** In priority order:
  1. Atkinson, Foster-Powell & Brand-Miller, *Diabetes Care* 2008;31:2281, Table 1 (averages across several labs).
  2. Food-specific studies: Alkaabi 2011 (dates); Shobana et al., *Indian J Med Res* 2022;155:56 (chickpea sundal, methi paratha); Henry et al., *Nutr Diabetes* 2021;11:2 (a collection of GI values for non-Western foods).\[1\]\[16\]
  3. A clearly labelled estimate.
- **Fried mixed dishes.** Nutrients are calculated from FCTB raw ingredients, with the assumed ingredient weights written out. These are marked `estimated: true`.
- **Portion weights.** Piece weights for iftar snacks are **estimates** of typical Dhaka street-stall sizes; I found no published Bangladeshi survey of portion weights. Weigh 5–10 pieces of each and replace the numbers.

### `lib/foods.ts`

```ts
// lib/foods.ts
// Roza-Safe food table. All carbs = AVAILABLE carbohydrate (fibre excluded).
// GI scale: glucose = 100. estimated=true => no measured value exists; see src for reasoning.
// FCTB = Food Composition Table for Bangladesh, Shaheen N et al., INFS Univ. of Dhaka / FAO, 2013.
// ATK08 = Atkinson FS, Foster-Powell K, Brand-Miller JC. Diabetes Care 2008;31:2281-3, Table 1.

export type Unit = "piece" | "cup" | "bowl" | "glass";

export interface Food {
  id: string;
  nameBn: string;
  nameEn: string;
  unit: Unit;
  portion: number;            // size of ONE unit
  portionUnit: "g" | "ml";
  carbsPerUnit: number;       // g available carbohydrate
  gi: number;                 // glucose = 100 (0 = negligible carbohydrate)
  fiberPerUnit: number;       // g
  proteinPerUnit: number;     // g
  estimated: boolean;         // true if GI and/or composition is an estimate
  src: string;
}

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

  { id: "piyaju", nameBn: "পেঁয়াজু", nameEn: "Piyaju (lentil-onion fritter)", unit: "piece", portion: 20, portionUnit: "g",
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

  { id: "shobji", nameBn: "সবজি", nameEn: "Mixed vegetable curry", unit: "bowl", portion: 150, portionUnit: "g",
    carbsPerUnit: 10, gi: 50, fiberPerUnit: 4, proteinPerUnit: 3, estimated: true,
    src: "ESTIMATE: potato (FCTB 05_0012), pumpkin (03_0028), brinjal (03_0005), gourds; GI 50 assumes some potato." },

  { id: "milk", nameBn: "দুধ", nameEn: "Milk, whole", unit: "glass", portion: 250, portionUnit: "ml",
    carbsPerUnit: 12.0, gi: 39, fiberPerUnit: 0, proteinPerUnit: 7.9, estimated: false,
    src: "Comp: USDA SR Legacy 'Milk, whole, 3.25%' FDC 171265 (4.80 CHO, 3.15 prot /100 g) - verify; FCTB 12_0008 also available. GI: ATK08 'Milk, full fat' 39±3." },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map(f => [f.id, f]));
```

### Source summary table

| Food | Portion | Carbs (g) | GI | GI basis | Status |
|---|---|---|---|---|---|
| Khejur | 8 g | 5.4 | 49 | Alkaabi 2011, T2D subjects | Measured |
| Jilapi | 40 g | 18 | 70 | Sucrose 65 / white bread 75 | **Estimate** |
| Beguni | 30 g | 6.0 | 40 | Besan foods 21–27 | **Estimate** |
| Piyaju | 20 g | 4.5 | 35 | Lentils 32 | **Estimate** |
| Alur chop | 60 g | 12.3 | 65 | Potato ~78 | **Estimate** |
| Chola bhuna | 120 g | 28.0 | 28 | ATK08; Shobana 2022: 24.1 | Measured\[1\]\[17\] |
| Muri | 30 g | 24.8 | 87 | Rice crackers proxy | **Estimate (proxy)** |
| Haleem | 200 g | 30 | 42 | Harees proxy | **Estimate** |
| Dimer chop | 90 g | 10 | 60 | — | **Estimate** |
| Samosa / Singara | 50 / 40 g | 15 / 12 | 60 | Omani sambosa 60.35 | **Estimate (proxy)**\[18\] |
| Pakora | 20 g | 5 | 40 | — | **Estimate** |
| Fruit chaat | 150 g | 18 | 50 | Fruit mix | **Estimate** |
| Banana / Watermelon / Papaya / Apple | 100 / 150 / 145 / 180 g | 20.2 / 10.7 / 13.2 / 20.5 | 51 / 76 / 59 / 36 | ATK08 (papaya: 2002 table) | Measured\[19\]\[20\] |
| Rooh Afza sharbat | 250 ml | 31.2 | 65 | Sucrose proxy | Label + proxy |
| Lemon water | 250 ml | 1 | 0 | — | Estimate |
| Lassi / Mishti doi | 250 ml / 100 g | 29 / 20 | 56 / 50 | Yogurt + sucrose | **Estimate** |
| Plain doi | 100 g | 4.7 | 41 | Fruit-yogurt proxy | Proxy |
| Payesh | 125 g | 27.5 | 57 | Rice-milk pudding proxy | **Estimate** |
| Cake | 60 g | 30 | 50 | — | **Estimate** |
| White / brown rice | 160 g | 39.7 / 37.1 | 73 / 68 | ATK08; BD varieties 44.6–75.7 | Measured\[17\] |
| Ruti / Paratha | 40 / 80 g | 19.9 / 33.9 | 52 / 60 | ATK08; Shobana 2022 | Measured\[1\]\[21\] |
| Dal | 150 g | 15.9 | 32 | Lentils, ATK08 | Comp estimated |
| Fish / chicken curry, egg | 100 / 100 / 50 g | 2 / 3 / 0.4 | 0 | Negligible carbohydrate | Estimate |
| Shobji | 150 g | 10 | 50 | — | **Estimate** |
| Milk | 250 ml | 12.0 | 39 | ATK08 | Measured\[21\] |

---

## Part 2 — IDF-DAR 2021 risk score (`lib/dar.ts`)

### Official table (copied exactly)
- **Source:** IDF & DAR International Alliance, *Diabetes and Ramadan: Practical Guidelines 2021*, Chapter 5, **Table 2, p. 94**, "Elements for risk calculation and suggested risk score for people with diabetes mellitus (DM) that seek to fast during Ramadan".
- **Journal version:** Hassanein M et al., *Diabetes Res Clin Pract* 2022;185:109185.
- **Copy used here:** Mehar S, *J Diabetes Nursing* 2024;28:JDN318, Figure 1, reprinted with IDF-DAR permission.

| # | Element | Options (points) |
|---|---|---|
| 1 | Diabetes type | Type 1 (1); Type 2 (0) |
| 2 | Duration of diabetes (years) | ≥10 (1); <10 (0) |
| 3 | Presence of hypoglycaemia | Hypoglycaemia unawareness (6.5); Recent severe hypoglycaemia (5.5); Multiple weekly hypoglycaemia (3.5); Hypoglycaemia less than 1 time per week (1); No hypoglycaemia (0) |
| 4 | Level of glycaemic control | HbA1c >9% (11.7 mmol/L) (2); 7.5–9% (9.4–11.7 mmol/L) (1); <7.5% (9.4 mmol/L) (0) |
| 5 | Type of treatment | Multiple daily mixed insulin injections (3); Basal bolus/insulin pump (2.5); Once daily mixed insulin (2); Basal insulin (1.5); Glibenclamide (1); Gliclazide/MR or glimepiride or repaglinide (0.5); Other therapy not including SU or insulin (0) |
| 6 | Self-monitoring of blood glucose (SMBG) | Indicated but not conducted (2); Indicated but conducted sub-optimally (1); Conducted as indicated (0) |
| 7 | Acute complications | DKA/HONC in the last 3 months (3); in the last 6 months (2); in the last 12 months (1); No DKA or HONC (0) |
| 8 | Macrovascular disease (MVD) complications/comorbidities | Unstable MVD (6.5); Stable MVD (2); No MVD (0) |
| 9 | Renal complications/comorbidities | eGFR <30 mL/min (6.5); 30–45 (4); 45–60 (2); >60 (0) |
| 10 | Pregnancy* | Pregnant not within targets (6.5); Pregnant within targets (3.5); Not pregnant (0) |
| 11 | Frailty and cognitive function | Impaired cognitive function or frail (6.5); >70 years old with no home support (3.5); No frailty or loss in cognitive function (0) |
| 12 | Physical labour | Highly intense (4); Moderate intense (2); None (0) |
| 13 | Previous Ramadan experience | Overall negative experience (1); No negative or positive experience (0) |
| 14 | Fasting hours (location) | ≥16 h (1); <16 h (0) |

*"Pregnant and breastfeeding women have the right to not fast regardless of whether they have diabetes."\[2\]

**Bands: score 0 to 3 = LOW RISK; 3.5 to 6 = MODERATE RISK; >6 = HIGH RISK.** All points come in steps of 0.5, so ">6" in practice means 6.5 or more.

### `lib/dar.ts`

```ts
// lib/dar.ts
// IDF-DAR Diabetes and Ramadan Practical Guidelines 2021, Chapter 5, Table 2 (p. 94).
// Hassanein M et al. Diabetes Res Clin Pract 2022;185:109185.
// Verbatim reprint: Mehar S. J Diabetes Nursing 2024;28:JDN318, Figure 1.
// Bands (same source): 0-3 Low, 3.5-6 Moderate, >6 High.

export type DarBand = "low" | "moderate" | "high";

export interface DarOption { id: string; labelEn: string; labelBn: string; points: number; }
export interface DarElement {
  id: string; no: number; titleEn: string; titleBn: string;
  options: DarOption[];
  inShortQuiz: boolean;          // part of the 8-question quick quiz
  autoAnswerForBD?: string;      // option id auto-selected in Bangladesh/T2D app context
}

export const DAR_ELEMENTS: DarElement[] = [
  { id: "type", no: 1, titleEn: "Diabetes type", titleBn: "ডায়াবেটিসের ধরন", inShortQuiz: false, autoAnswerForBD: "t2",
    options: [
      { id: "t1", labelEn: "Type 1 diabetes", labelBn: "টাইপ ১ ডায়াবেটিস", points: 1 },
      { id: "t2", labelEn: "Type 2 diabetes", labelBn: "টাইপ ২ ডায়াবেটিস", points: 0 },
    ] },
  { id: "duration", no: 2, titleEn: "Duration of diabetes (years)", titleBn: "কত বছর ধরে ডায়াবেটিস", inShortQuiz: false,
    options: [
      { id: "ge10", labelEn: "10 years or more", labelBn: "১০ বছর বা তার বেশি", points: 1 },
      { id: "lt10", labelEn: "Less than 10 years", labelBn: "১০ বছরের কম", points: 0 },
    ] },
  { id: "hypo", no: 3, titleEn: "Presence of hypoglycaemia", titleBn: "সুগার কমে যাওয়া (হাইপোগ্লাইসেমিয়া)", inShortQuiz: true,
    options: [
      { id: "unaware", labelEn: "Hypoglycaemia unawareness", labelBn: "সুগার কমলেও টের পান না", points: 6.5 },
      { id: "severe", labelEn: "Recent severe hypoglycaemia", labelBn: "সম্প্রতি গুরুতর সুগার কমেছে (অন্যের সাহায্য লেগেছে)", points: 5.5 },
      { id: "weekly", labelEn: "Multiple weekly hypoglycaemia", labelBn: "সপ্তাহে একাধিকবার সুগার কমে", points: 3.5 },
      { id: "lt1week", labelEn: "Hypoglycaemia less than 1 time per week", labelBn: "সপ্তাহে ১ বারের কম", points: 1 },
      { id: "none", labelEn: "No hypoglycaemia", labelBn: "কখনো সুগার কমে না", points: 0 },
    ] },
  { id: "hba1c", no: 4, titleEn: "Level of glycaemic control (HbA1c)", titleBn: "HbA1c (৩ মাসের গড় সুগার)", inShortQuiz: true,
    options: [
      { id: "gt9", labelEn: "HbA1c > 9% (eAG 11.7 mmol/L)", labelBn: "৯% এর বেশি", points: 2 },
      { id: "7_5to9", labelEn: "HbA1c 7.5–9% (eAG 9.4–11.7 mmol/L)", labelBn: "৭.৫% থেকে ৯%", points: 1 },
      { id: "lt7_5", labelEn: "HbA1c < 7.5% (eAG 9.4 mmol/L)", labelBn: "৭.৫% এর কম", points: 0 },
    ] },
  { id: "treatment", no: 5, titleEn: "Type of treatment", titleBn: "চিকিৎসার ধরন", inShortQuiz: true,
    options: [
      { id: "mdi_mixed", labelEn: "Multiple daily mixed insulin injections", labelBn: "দিনে একাধিকবার মিক্সড ইনসুলিন", points: 3 },
      { id: "basal_bolus", labelEn: "Basal bolus / insulin pump", labelBn: "বেসাল-বোলাস / ইনসুলিন পাম্প", points: 2.5 },
      { id: "od_mixed", labelEn: "Once daily mixed insulin", labelBn: "দিনে একবার মিক্সড ইনসুলিন", points: 2 },
      { id: "basal", labelEn: "Basal insulin", labelBn: "শুধু বেসাল ইনসুলিন", points: 1.5 },
      { id: "glibenclamide", labelEn: "Glibenclamide", labelBn: "গ্লিবেনক্লামাইড", points: 1 },
      { id: "gliclazide_etc", labelEn: "Gliclazide/MR or glimepiride or repaglinide", labelBn: "গ্লিক্লাজাইড / গ্লিমেপিরাইড / রিপাগ্লিনাইড", points: 0.5 },
      { id: "other", labelEn: "Other therapy not including SU or insulin (incl. diet only)", labelBn: "অন্য ওষুধ বা শুধু খাদ্যনিয়ন্ত্রণ", points: 0 },
    ] },
  { id: "smbg", no: 6, titleEn: "Self-monitoring of blood glucose (SMBG)", titleBn: "নিজে সুগার মাপা", inShortQuiz: true,
    options: [
      { id: "not_done", labelEn: "Indicated but not conducted", labelBn: "মাপা দরকার কিন্তু মাপেন না", points: 2 },
      { id: "suboptimal", labelEn: "Indicated but conducted sub-optimally", labelBn: "মাঝে মাঝে মাপেন", points: 1 },
      { id: "as_indicated", labelEn: "Conducted as indicated", labelBn: "নিয়মিত মাপেন", points: 0 },
    ] },
  { id: "acute", no: 7, titleEn: "Acute complications (DKA/HONC)", titleBn: "জরুরি জটিলতা (DKA/HHS)", inShortQuiz: false,
    options: [
      { id: "3m", labelEn: "DKA/HONC in the last 3 months", labelBn: "গত ৩ মাসে", points: 3 },
      { id: "6m", labelEn: "DKA/HONC in the last 6 months", labelBn: "গত ৬ মাসে", points: 2 },
      { id: "12m", labelEn: "DKA/HONC in the last 12 months", labelBn: "গত ১২ মাসে", points: 1 },
      { id: "none", labelEn: "No DKA or HONC", labelBn: "কখনো হয়নি", points: 0 },
    ] },
  { id: "mvd", no: 8, titleEn: "Macrovascular complications/comorbidities", titleBn: "হার্ট/স্ট্রোক/রক্তনালির রোগ", inShortQuiz: true,
    options: [
      { id: "unstable", labelEn: "Unstable MVD", labelBn: "অস্থিতিশীল (সম্প্রতি সমস্যা)", points: 6.5 },
      { id: "stable", labelEn: "Stable MVD", labelBn: "স্থিতিশীল", points: 2 },
      { id: "none", labelEn: "No MVD", labelBn: "নেই", points: 0 },
    ] },
  { id: "renal", no: 9, titleEn: "Renal complications (eGFR)", titleBn: "কিডনির অবস্থা (eGFR)", inShortQuiz: true,
    options: [
      { id: "lt30", labelEn: "eGFR < 30 mL/min", labelBn: "৩০ এর কম", points: 6.5 },
      { id: "30to45", labelEn: "eGFR 30–45 mL/min", labelBn: "৩০–৪৫", points: 4 },
      { id: "45to60", labelEn: "eGFR 45–60 mL/min", labelBn: "৪৫–৬০", points: 2 },
      { id: "gt60", labelEn: "eGFR > 60 mL/min", labelBn: "৬০ এর বেশি / কিডনি ভালো", points: 0 },
    ] },
  { id: "pregnancy", no: 10, titleEn: "Pregnancy", titleBn: "গর্ভাবস্থা", inShortQuiz: false,
    options: [
      { id: "not_target", labelEn: "Pregnant not within targets", labelBn: "গর্ভবতী, সুগার নিয়ন্ত্রণে নেই", points: 6.5 },
      { id: "in_target", labelEn: "Pregnant within targets", labelBn: "গর্ভবতী, সুগার নিয়ন্ত্রণে", points: 3.5 },
      { id: "no", labelEn: "Not pregnant", labelBn: "গর্ভবতী নন", points: 0 },
    ] },
  { id: "frailty", no: 11, titleEn: "Frailty and cognitive function", titleBn: "দুর্বলতা ও স্মৃতিশক্তি", inShortQuiz: true,
    options: [
      { id: "frail", labelEn: "Impaired cognitive function or frail", labelBn: "স্মৃতিশক্তি কমেছে বা খুব দুর্বল", points: 6.5 },
      { id: "gt70_alone", labelEn: ">70 years old with no home support", labelBn: "৭০ বছরের বেশি, বাসায় সাহায্যকারী নেই", points: 3.5 },
      { id: "none", labelEn: "No frailty or loss in cognitive function", labelBn: "কোনো সমস্যা নেই", points: 0 },
    ] },
  { id: "labour", no: 12, titleEn: "Physical labour", titleBn: "শারীরিক পরিশ্রম", inShortQuiz: true,
    options: [
      { id: "high", labelEn: "Highly intense physical labour", labelBn: "খুব ভারী কাজ (যেমন রিকশা চালানো)", points: 4 },
      { id: "moderate", labelEn: "Moderate intense physical labour", labelBn: "মাঝারি পরিশ্রম", points: 2 },
      { id: "none", labelEn: "No physical labour", labelBn: "ভারী কাজ করি না", points: 0 },
    ] },
  { id: "experience", no: 13, titleEn: "Previous Ramadan experience", titleBn: "আগের রমজানের অভিজ্ঞতা", inShortQuiz: false,
    options: [
      { id: "negative", labelEn: "Overall negative experience", labelBn: "খারাপ অভিজ্ঞতা হয়েছিল", points: 1 },
      { id: "neutral", labelEn: "No negative or positive experience", labelBn: "সমস্যা হয়নি", points: 0 },
    ] },
  { id: "hours", no: 14, titleEn: "Fasting hours (location)", titleBn: "রোজার সময়কাল", inShortQuiz: false, autoAnswerForBD: "lt16",
    options: [
      { id: "ge16", labelEn: "≥ 16 hours", labelBn: "১৬ ঘণ্টা বা বেশি", points: 1 },
      { id: "lt16", labelEn: "< 16 hours", labelBn: "১৬ ঘণ্টার কম", points: 0 },
    ] },
];

export type DarAnswers = Partial<Record<string, string>>; // elementId -> optionId

export function darBand(score: number): DarBand {
  if (score <= 3) return "low";        // "SCORE 0 TO 3"
  if (score <= 6) return "moderate";   // "SCORE 3.5 TO 6"
  return "high";                       // "SCORE > 6"
}

export function scoreDar(answers: DarAnswers, opts: { applyBDDefaults?: boolean } = {}) {
  let score = 0;
  const missing: string[] = [];
  const breakdown: { element: string; option: string; points: number }[] = [];
  for (const el of DAR_ELEMENTS) {
    let optId = answers[el.id];
    if (!optId && opts.applyBDDefaults && el.autoAnswerForBD) optId = el.autoAnswerForBD;
    const opt = el.options.find(o => o.id === optId);
    if (!opt) { missing.push(el.id); continue; }      // unanswered counted as 0 but reported
    score += opt.points;
    breakdown.push({ element: el.id, option: opt.id, points: opt.points });
  }
  return { score, band: darBand(score), missing, breakdown, isMinimum: missing.length > 0 };
}

export const SHORT_QUIZ = DAR_ELEMENTS.filter(e => e.inShortQuiz);
// Safety gate (ask BEFORE quiz): pregnant/breastfeeding? -> if yes, show "consult your doctor" and score element 10.
```

**Short quiz (8 questions):** hypoglycaemia, HbA1c, treatment, blood-glucose self-monitoring, heart/blood-vessel disease, kidney function (eGFR), frailty/memory and physical labour. Physical labour stays in because heavy manual work is common in Bangladesh and carries 4 points.

**Left out of the quick quiz** (the full table is still in the code):
- **Diabetes type (1):** set automatically to type 2, since the app is for type 2 diabetes.
- **Fasting hours (14):** set automatically to under 16 h. This is my reasoning, not a published source. Dhaka is at about 23.8°N. Even in June the fast is about 13.5 h of daylight plus about 1.3 h before sunrise (from Fajr), which stays under 16 h. Ramadan falls in February–March in 2026–2027.
- **Duration (up to 1 point), acute complications (up to 3) and previous Ramadan experience (up to 1):** left out.
- **Pregnancy (6.5):** handled by a yes/no question before the quiz starts.

The quick quiz can therefore under-count by **up to 5 points** (1 + 3 + 1). Label quick-quiz results as a "minimum score", and offer the full quiz whenever the quick result is within 5 points of the next band up.

### Test cases (scored with the real table)

| Case | Points counted | Score | Band | Expected | Match? |
|---|---|---|---|---|---|
| **A**: type 2, diet only, no hypos, HbA1c <7.5%, no complications | Type 2: 0; hypos: 0; HbA1c: 0; "other therapy": 0; all others 0 (assumes <10 years, self-monitoring not required or done, <16 h fast) | **0** | **Low** | Low | ✅ Even with 10+ years of diabetes (+1) the score is 1, still Low |
| **B**: type 2 on sulfonylurea tablets, HbA1c 8–9%, otherwise healthy | Type 2: 0; HbA1c 7.5–9%: **1**; gliclazide/glimepiride: **0.5** (or glibenclamide: **1**) | **1.5** (or **2.0**) | **Low** | Moderate | ❌ **The real table gives Low.** Moderate (3.5 or more) needs extra factors. Example: glibenclamide (2.0) + self-monitoring required but not done (+2) = 4.0 |
| **C**: type 2 on multiple daily insulin injections, recent severe hypo, eGFR 30–45 | Type 2: 0; recent severe hypo: **5.5**; basal-bolus: **2.5** (or multiple daily mixed: **3**); eGFR 30–45: **4** | **12** (or **12.5**) | **High** | High | ✅ |

Assumptions:
- Anything a case doesn't mention scores 0.
- For hypos and treatment, pick the single highest option that applies; each element's options are mutually exclusive.
- "Multiple daily injections" could mean basal-bolus (2.5) or multiple daily *mixed* insulin (3). Either gives High.

Unit tests:

```ts
// __tests__/dar.test.ts
import { scoreDar } from "../lib/dar";
const base = { type: "t2", duration: "lt10", hypo: "none", hba1c: "lt7_5", treatment: "other", smbg: "as_indicated",
  acute: "none", mvd: "none", renal: "gt60", pregnancy: "no", frailty: "none", labour: "none", experience: "neutral", hours: "lt16" };
test("Case A -> Low (0)", () => expect(scoreDar(base)).toMatchObject({ score: 0, band: "low" }));
test("Case B -> Low (1.5), NOT moderate", () =>
  expect(scoreDar({ ...base, hba1c: "7_5to9", treatment: "gliclazide_etc" })).toMatchObject({ score: 1.5, band: "low" }));
test("Case C -> High (12)", () =>
  expect(scoreDar({ ...base, hypo: "severe", treatment: "basal_bolus", renal: "30to45" })).toMatchObject({ score: 12, band: "high" }));
```

---

## Part 3 — Forecast curve tuning (`lib/forecast.ts`)

### Evidence for each constant

| Constant | Old | **Tuned** | Evidence |
|---|---|---|---|
| Safe zone upper limit | 10.0 | **10.0 mmol/L** | ADA Standards of Care 2025, Table 6.3: peak post-meal capillary glucose "<180 mg/dL (<10.0 mmol/L)", measured "1–2 h after the beginning of the meal, which is generally the timing for peak levels in people with diabetes"\[22\] |
| Safe zone lower limit | 4.0 | **4.0** (alert below 3.9) | ADA level-1 hypoglycaemia is <70 mg/dL (3.9 mmol/L); IDF-DAR says break the fast below 3.9 mmol/L\[2\]\[22\] |
| Peak time T | 45 min | **75 min** | CGM in 30 people with type 2 diabetes not yet on medication: median time to post-meal peak 70–85 min (PMC3728307). ADA: peak at 1–2 h\[23\] |
| k (mmol/L per GL unit) | 0.12 | **0.12** (plausible range 0.10–0.28) | **Lower bound** (my inference): the same CGM study found post-meal rises of 83–109 mg/dL (4.6–6.1 mmol/L) after hospital meals. *Assuming* those meals had a GL of about 50 gives about 0.09–0.12 per GL unit. **Upper bound:** 1 g glucose raises blood glucose about 5 mg/dL (0.28 mmol/L) in a 140-lb person with type 2 diabetes *when their own insulin isn't responding* (Bernstein). An NHS Worcestershire patient leaflet's rule of thumb is that 10 g carbohydrate raises glucose 2–3 mmol/L. People with type 2 diabetes who aren't on insulin still make some insulin, so the lower end fits\[23\]\[24\]\[25\] |
| Fibre+protein dampening | 0.01/g, cap 0.30 | **0.006/g, cap 0.30** | Jakubowicz D et al., *Diabetologia* 2014;57(9):1807–1811 (50 g whey protein before a meal, type 2 diabetes): "over the whole 180 min post-meal period, glucose levels were reduced by 28% after whey protein pre-load".\[26\]\[27\] 28% / 50 g ≈ 0.0056 per g. The 0.30 cap is about the largest effect seen\[26\] |
| Walk factor | 0.85 | **0.85** | Reynolds AN et al., *Diabetologia* 2016;59(12):2572–2578, 41 adults with type 2 diabetes: a 10-min walk after each meal lowered post-meal glucose 12% overall compared with one 30-min walk a day. The University of Otago reported a "highly significant 22 per cent reduction in blood sugar when walking after evening meals, which were the most carbohydrate heavy."\[28\]\[29\] 0.85 sits in the middle. These are reductions in total glucose over time (area under the curve), not in the peak\[30\]\[31\] |
| Peak range | ±15% | **±15% of the rise** | A display choice, not from evidence; it shows that people vary |
| Time shown | 0–120 | **0–180 min** (recommended) | With a 75-min peak the curve is still at 88% of its peak at 120 min; in type 2 diabetes glucose takes about 3 h to come back down\[32\] |

### `lib/forecast.ts`

```ts
// lib/forecast.ts
// Explainable glucose-trend illustration for iftar plates. NOT a medical device / NOT a dosing tool.
import { FOOD_BY_ID } from "./foods";

export const FORECAST = {
  BASELINE_DEFAULT: 5.5,      // mmol/L, last pre-iftar reading if none entered
  K_PER_GL: 0.12,             // mmol/L rise per GL unit (evidence-plausible 0.10-0.28)
  T_PEAK_MIN: 75,             // CGM T2D median 70-85 min (PMC3728307); ADA: 1-2 h
  DAMPEN_PER_G: 0.006,        // per g (fibre+protein); whey 50 g -> -28% (Jakubowicz 2014)
  DAMPEN_CAP: 0.30,
  WALK_FACTOR: 0.85,          // Reynolds 2016: -12% overall, -22% after evening meal
  SAFE_LOW: 4.0,
  SAFE_HIGH: 10.0,            // ADA 2025 peak postprandial <10.0 mmol/L
  RANGE_PCT: 0.15,
  HORIZON_MIN: 180,
  STEP_MIN: 15,
} as const;

export interface PlateItem { foodId: string; count: number; }
export interface ForecastOptions { baseline?: number; walk15?: boolean; personal?: number; }

export function plateTotals(plate: PlateItem[]) {
  let carbs = 0, gl = 0, fiberProt = 0;
  for (const { foodId, count } of plate) {
    const f = FOOD_BY_ID[foodId];
    if (!f) throw new Error(`Unknown food ${foodId}`);
    carbs += f.carbsPerUnit * count;
    gl += f.carbsPerUnit * count * (f.gi / 100);
    fiberProt += (f.fiberPerUnit + f.proteinPerUnit) * count;
  }
  return { carbs, gl, fiberProt };
}

export const shape = (t: number, T = FORECAST.T_PEAK_MIN) => (t <= 0 ? 0 : (t / T) * Math.exp(1 - t / T));

export function forecast(plate: PlateItem[], o: ForecastOptions = {}) {
  const C = FORECAST;
  const baseline = o.baseline ?? C.BASELINE_DEFAULT;
  const personal = o.personal ?? 1;
  const { carbs, gl, fiberProt } = plateTotals(plate);
  const dampen = 1 - Math.min(C.DAMPEN_CAP, fiberProt * C.DAMPEN_PER_G);
  const walk = o.walk15 ? C.WALK_FACTOR : 1;
  const rise = C.K_PER_GL * gl * dampen * walk * personal;

  const points: { t: number; glucose: number }[] = [];
  for (let t = 0; t <= C.HORIZON_MIN; t += C.STEP_MIN) {
    points.push({ t, glucose: +(baseline + rise * shape(t)).toFixed(2) });
  }
  const peak = baseline + rise;
  const peakLow = baseline + rise * (1 - C.RANGE_PCT);
  const peakHigh = baseline + rise * (1 + C.RANGE_PCT);
  const zone = peak > C.SAFE_HIGH ? "high" : peak < C.SAFE_LOW ? "low" : "safe";
  return { carbs, gl, fiberProt, dampen, walk, rise, peak, peakLow, peakHigh, peakAtMin: C.T_PEAK_MIN, zone, points };
}

// Demo plates used in the pitch
export const JILAPI_HEAVY: PlateItem[] = [
  { foodId: "jilapi", count: 2 }, { foodId: "beguni", count: 3 }, { foodId: "piyaju", count: 2 },
  { foodId: "khejur", count: 3 }, { foodId: "rooh_afza_sharbat", count: 1 },
];
export const WITH_SWAPS: PlateItem[] = [
  { foodId: "jilapi", count: 1 }, { foodId: "beguni", count: 3 }, { foodId: "piyaju", count: 2 },
  { foodId: "khejur", count: 2 }, { foodId: "chola_bhuna", count: 1 }, { foodId: "lemon_water", count: 1 },
]; // run with { walk15: true }
```

### Worked examples (starting glucose 5.5 mmol/L)

**Jilapi-heavy plate:** 2 jilapi + 3 beguni + 2 piyaju + 3 khejur + 1 glass Rooh Afza
- Carbs: 36 + 18 + 9 + 16.2 + 31.2 = **110.4 g**.
- GL: 25.2 + 7.2 + 3.15 + 7.94 + 20.28 = **63.77**.
- Fibre + protein: 3.0 + 9.0 + 7.0 + 2.4 + 0.1 = 21.5 g, so dampen = 1 − 0.129 = 0.871.
- Rise = 0.12 × 63.77 × 0.871 = **6.66 mmol/L**. **Peak is 12.2 mmol/L** (range 11.2–13.2). That is **above 10, so the app shows a spike warning.**

**With swaps:** 1 jilapi + 3 beguni + 2 piyaju + 2 khejur + 1 cup chola + lemon water + 15-min walk
- Carbs: **84.8 g**.
- GL: 12.6 + 7.2 + 3.15 + 5.29 + 7.84 = **36.08**.
- Fibre + protein: 1.5 + 9.0 + 7.0 + 1.6 + 23.6 = 42.7 g, so dampen = 0.744. Walk factor = 0.85.
- Rise = 0.12 × 36.08 × 0.744 × 0.85 = **2.74 mmol/L**. **Peak is 8.2 mmol/L** (range 7.8–8.6). That is **inside 4–10, in the safe zone.**

**Curve points (mmol/L).** With the peak at 75 min, the curve shape at each 15-min step from 0 to 120 min is 0, 0.445, 0.729, 0.895, 0.977, 1.000, 0.982, 0.938, 0.878.

| t (min) | 0 | 15 | 30 | 45 | 60 | 75 | 90 | 105 | 120 |
|---|---|---|---|---|---|---|---|---|---|
| Jilapi-heavy | 5.50 | 8.47 | 10.36 | 11.47 | 12.01 | **12.17** | 12.05 | 11.75 | 11.35 |
| With swaps + walk | 5.50 | 6.72 | 7.50 | 7.95 | 8.17 | **8.24** | 8.19 | 8.07 | 7.90 |

### What I changed and why
- **Your original constants already passed:** jilapi plate 11.5 mmol/L at 45 min, swap plate 8.1 mmol/L.
- **I changed two constants, only to match the evidence:**
  - **Peak time, 45 → 75 min,** to match CGM data in type 2 diabetes.
  - **Dampening, 0.01 → 0.006 per g.** The old value made 28 g of protein and fibre from fried snacks as powerful as 50 g of whey, which overstates it.
- **I did not change k to hit a target.** With everything else fixed, the jilapi plate stays above 10 for any k above 0.081, and the swap plate stays below 10 for any k below 0.197. The demo works across the whole plausible range of k.
- **Judges may ask why adding chola lowers the peak when it adds carbs.**
  - Chola adds 28 g of carbs but only 7.8 GL, because its GI is 28. It also adds 23.6 g of fibre and protein.
  - Dropping one jilapi, one date and the sharbat removes 23.2 GL. That is most of the effect.

---

## How to explain this to judges

**foods.ts.** "Every carb, fibre and protein number traces to a Bangladeshi government food-table code (FCTB 2013, University of Dhaka/FAO) or a USDA FDC ID. Every GI traces to the Sydney international GI tables or a named study, including a study of dates in people with type 2 diabetes. Where no measured GI exists, as for jilapi and beguni, we say so on screen and show how we estimated it." Point to the `estimated` flag, which shows an "≈" badge in the app.

**dar.ts.** "This is the IDF-DAR 2021 risk calculator, copied element by element from Table 2 on page 94 of the official guidelines and tested in a Bangladeshi group of patients (the DAR-BAN study). Our unit tests use the real table, and they showed that a typical sulfonylurea patient with HbA1c 8–9% scores Low, not Moderate. We report the real result rather than adjusting it." The quick quiz is labelled a minimum score. The app never tells anyone to fast; it says "discuss with your doctor".

**forecast.ts.** "This is an explainable illustration, not a prediction device. Three settings are pinned to evidence:
- The curve peaks at 75 min, as measured with glucose monitors in people with type 2 diabetes.
- A 15-min walk cuts the rise by 15%, in line with the 2016 Reynolds trial (12–22%).\[30\]
- Protein and fibre soften the rise at a rate taken from the whey-protein trial (28% for 50 g).

The 10 mmol/L line is the ADA's peak post-meal target.\[33\] The one free setting, k, gives the right behaviour anywhere from 0.08 to 0.20, so we didn't cherry-pick it." Always show the ±15% band, and let users adjust the "personal factor" using their own glucometer readings.

---

## Caveats and values I could not verify
- **USDA FDC IDs.** The IDs (dates 171726, banana 173944, watermelon 167765, papaya 169926, apple 171688, yogurt 171284, egg 171287, milk 171265) and their per-100 g values are from SR Legacy, but **I did not re-open those pages**. Check them before submission.
- **Three GI values are from memory of the 2008 table and need checking:** papaya 59, boiled potato ~78 and lentils 32.
- **FCTB values for fruit, milk, fish, chicken and payesh weren't in the pages I read.** Those chapters exist (e.g. banana 08_0004, milk 12_0008, payesh recipe 12_0013). Swap the FCTB numbers in for the USDA figures and estimates so the table is fully Bangladeshi.
- **No measured GI exists** for jilapi, beguni, piyaju, pakora, alur chop, dimer chop, haleem, muri, lassi, mishti doi, cake or shobji. I found no controlled GI test for jalebi or other mishti.\[34\] Consumer websites quoting "jalebi GI 85–95" give no original source.\[35\]\[36\]\[37\] **Don't cite them.**
- **The lower bound for k is my own inference.** It assumes the Japanese hospital meals had a GL of about 50; the study didn't report GL.
- **The walk and whey studies measured total glucose over time, not the peak.** Using them as peak multipliers is a simplification.
- **The IDF-DAR score is based on expert opinion.**
  - The DAR-BAN study (Kamrul-Hasan et al. 2023) found it "conservative" for people with type 2 diabetes in Bangladesh.\[38\]
  - A primary-care validation study found "no significant difference between moderate- and high-risk categories in the occurrence of significant adverse events (SAEs)" (*Frontiers in Clinical Diabetes and Healthcare*, 21 Mar 2025, doi:10.3389/fcdhc.2025.1426120).\[39\]\[40\]
  - Present the score as a starting point for a conversation with a doctor, not a verdict.

## Sources

1. [Carbohydrate profiling & glycaemic indices of selected traditional Indian foods](https://ijmr.org.in/carbohydrate-profiling-glycaemic-indices-of-selected-traditional-indian-foods/)
2. [Fasting and feasting safely with type 2 diabetes in the ...](https://diabetesonthenet.com/wp-content/uploads/JDN_28-1_JDN318.pdf)
3. [Ramadan risk score – Clinical Pathways](https://clinicalpathways.io/diabetes/ramadan/risk-score/)
4. [Validity of the New International Diabetes Federation-Diabetes and Ramadan (IDF-DAR) Risk Stratification Score and Fasting Experience of Saudi Patients With Diabetes During Ramadan: Insights From a Cross-Sectional Study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11929123/)
5. [Risk stratification using the 2021 IDF-DAR risk calculator and fasting experience of Bangladeshi subjects with type 2 diabetes in Ramadan: The DAR-BAN study - PubMed](https://pubmed.ncbi.nlm.nih.gov/36861141/)
6. [(PDF) Risk stratification using the 2021 IDF-DAR risk calculator and fasting experience of Bangladeshi subjects with type 2 diabetes in Ramadan: The DAR-BAN study](https://www.researchgate.net/publication/368546716_Risk_stratification_using_the_2021_IDF-DAR_risk_calculator_and_fasting_experience_of_Bangladeshi_subjects_with_type_2_diabetes_in_Ramadan_the_DAR-BAN_study)
7. [(PDF) Impact of the IDF-DAR Risk Stratification and Pre-Ramadan Education on Diabetes-Related Complications](https://www.researchgate.net/publication/392471861_Impact_of_the_IDF-DAR_Risk_Stratification_and_Pre-Ramadan_Education_on_Diabetes-Related_Complications)
8. [Personalized risk reduction strategies utilizing the diabetes and ramadan risk calculator: a narrative review](https://link.springer.com/article/10.1007/s40200-024-01506-3)
9. [Diabetes care across the Islamic calendar: Ramadan fasting and Hajj pilgrimage - PubMed](https://pubmed.ncbi.nlm.nih.gov/43040788)
10. [\[PDF\] Glycemic Index Values of Rice Varieties that are Commonly Available in Markets in Bangladesh](https://www.semanticscholar.org/paper/Glycemic-Index-Values-of-Rice-Varieties-that-are-in-Kabir-Hossain/73954a2d6a8e71790fec95bdaf1d63d4000dcc94)
11. [(PDF) Most of the popular rice varieties in Bangladesh are of medium glycemic index (GI)](https://www.academia.edu/95293321/Most_of_the_popular_rice_varieties_in_Bangladesh_are_of_medium_glycemic_index_GI_)
12. [Dataset on developing low glycemic index rice variety suitable for irrigated ecosystem in Bangladesh - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2352340924007236)
13. [BRRI’s new rice variety can be a game changer - The Business Post](https://businesspostbd.com/front/brris-new-rice-variety-can-be-a-game-changer-2023-02-25)
14. [The Glycemic Indices of Five Common Varieties of Dates in the Tested Among Healthy and Diabetic Subjects](https://clinicaltrials.gov/study/NCT01307904)
15. [Glycemic indices of five varieties of dates in healthy and diabetic subjects - Document - Gale Academic OneFile](https://go.gale.com/ps/anonymous?id=GALE%7CA258617718&issn=14752891&it=r&linkaccess=abs&p=AONE&sid=googleScholar&sw=w&v=2.1)
16. [A glycaemic index compendium of non-western foods - Nutrition & Diabetes](https://nature.com/articles/s41387-020-00145-w)
17. [What is Glycemic Index & Glycemic Load? Low GI foods and Weight Loss](https://healthjade.net/what-is-glycaemic-gi-index/)
18. [A glycaemic index compendium of non-western foods - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791047/)
19. [Glycemic Index Chart: GI & GL of 67 Foods](https://helsa.health/glycemic-index)
20. [VA Office of Patient Centered Care and Cultural Transformation Page 1 of 4](https://www.va.gov/WHOLEHEALTHLIBRARY/docs/Glycemic-Index.pdf)
21. [Glycemic index for 60+ foods](https://fertility.mthfrsupport.com.au/wp-content/uploads/2020/06/Glycemic-index-for-60-foods-Harvard-Health.pdf)
22. [6\. Glycemic Goals and Hypoglycemia: Standards of Care in Diabetes—2025](https://diabetesjournals.org/care/article/48/Supplement_1/S128/157561/6-Glycemic-Goals-and-Hypoglycemia-Standards-of)
23. [24-Hour Glycemic Variations in Drug-Naïve Patients with Type 2 Diabetes: A Continuous Glucose Monitoring (CGM)-Based Study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3728307/)
24. [Carbohydrate awareness for people with diabetes - Worcestershire Acute Hospitals NHS Trust](https://www.worcsacute.nhs.uk/leaflets/carbohydrate-awareness-for-people-with-diabetes/)
25. [Raising Blood Sugars Predictably - Dr. Bernstein's Diabetes Solution. A Complete Guide to Achieving Normal Blood Sugars. Official Web Site](https://www.diabetes-book.com/raising-blood-sugar/)
26. [Incretin, insulinotropic and glucose-lowering effects of whey protein pre-load in type 2 diabetes: a randomised clinical trial](https://link.springer.com/article/10.1007/s00125-014-3305-x)
27. [Incretin, insulinotropic and glucose-lowering effects of whey protein pre-load in type 2 diabetes: A randomised clinical trial - Ariel University](https://cris.ariel.ac.il/en/publications/incretin-insulinotropic-and-glucose-lowering-effects-of-whey-prot-3/)
28. [18 October 2016, Short walks after meals may prove important tool in managing diabetes, News and events, Edgar Diabetes and Obesity Research Centre](https://www.otago.ac.nz/news/newsroom/short-walks-after-meals-may-prove-important-tool-in-managing-diabetes)
29. [Walking After Meals and Blood Sugar: What Studies Show](https://www.longevityden.com/post-walking-after-meals)
30. [The 10-minute walk after meals: what it does to your blood sugar](https://www.medijournaldaily.com/body/ten-minute-walk-after-meals-blood-sugar)
31. [Walking After Eating: How Soon, How Long, and Why · ZEN LABO](https://zen-labo.com/blog/en/walking-after-eating/)
32. [What does postprandial glucose mean? • Vively](https://www.vively.com.au/post/what-does-postprandial-glucose-mean)
33. [6\. Glycemic Goals and Hypoglycemia: Standards of Care in Diabetes—2025](https://sentucuman.com.ar/docs/6ADA2025.pdf)
34. [The Diabetic's Diwali: How to Celebrate Without the Sugar Crash](https://fromlabtolifestylebysunita.substack.com/p/the-diabetics-diwali-how-to-celebrate)
35. [Glycemic Index Of Indian Foods](https://medtalkcentral.com/health-topics/diabetes/glycemic-index-indian-foods-complete-chart/)
36. [Jalebi - Is It Diabetic-Safe? - Glycemic Index of Indian Foods](https://glycemicindia.com/food/jalebi)
37. [Foods with High Glycemic Index: What to Eat and Avoid for Better Blood Sugar Control](https://www.fitterfly.com/blog/high-glycemic-index-foods/)
38. [Evolution of the risk concept and assessment tools for diabetes during Ramadan fasting: A narrative review - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12635770/)
39. [Validation of the IDF-DAR risk assessment tool for Ramadan fasting in patients with diabetes in primary care](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11968361/)
40. [(PDF) Validation of the IDF-DAR risk assessment tool for Ramadan fasting in patients with diabetes in primary care OPEN ACCESS EDITED BY REVIEWED BY](https://www.researchgate.net/publication/390055871_Validation_of_the_IDF-DAR_risk_assessment_tool_for_Ramadan_fasting_in_patients_with_diabetes_in_primary_care_OPEN_ACCESS_EDITED_BY_REVIEWED_BY)
