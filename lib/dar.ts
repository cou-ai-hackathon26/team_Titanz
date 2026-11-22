// IDF-DAR fasting risk score.
// Source: IDF & DAR International Alliance, "Diabetes and Ramadan: Practical Guidelines 2021",
// Chapter 5, Table 2 (p. 94). Journal version: Hassanein M et al., Diabetes Res Clin Pract 2022;185:109185.
// Checked word for word against the reprint in Mehar S, J Diabetes Nursing 2024;28:JDN318, Figure 1.
// The POINTS below are copied exactly. Only the Bangla wording is ours.
// Bands (same source): score 0–3 = Low, 3.5–6 = Moderate, more than 6 = High.

export type DarBand = 'low' | 'moderate' | 'high';

export type DarOption = {
  id: string;
  points: number; // from the official table
  labelBn: string; // what the user taps (plain Bangla)
  labelEn: string; // short English line under it
  reasonBn?: string; // short "why" chip on the result screen (only for options that add points)
};

export type DarElement = {
  id: string;
  no: number; // row number in the official table
  questionBn: string;
  questionEn: string;
  topicBn: string; // small chip above the question
  topicIcon: 'bloodtype' | 'medication' | 'favorite' | 'water_drop' | 'elderly' | 'construction' | 'pregnant_woman' | 'quiz';
  hintBn?: string; // help line under the answers
  options: DarOption[];
};

export const DAR_ELEMENTS: DarElement[] = [
  {
    id: 'type', no: 1, topicBn: 'ডায়াবেটিস', topicIcon: 'bloodtype',
    questionBn: 'আপনার কোন ধরনের ডায়াবেটিস?', questionEn: 'Which type of diabetes do you have?',
    options: [
      { id: 't1', points: 1, labelBn: 'টাইপ ১', labelEn: 'Type 1', reasonBn: 'টাইপ ১ ডায়াবেটিস' },
      { id: 't2', points: 0, labelBn: 'টাইপ ২', labelEn: 'Type 2' },
    ],
  },
  {
    id: 'duration', no: 2, topicBn: 'ডায়াবেটিস', topicIcon: 'bloodtype',
    questionBn: 'কত বছর ধরে ডায়াবেটিস?', questionEn: 'How long have you had diabetes?',
    options: [
      { id: 'ge10', points: 1, labelBn: '১০ বছর বা তার বেশি', labelEn: '10 years or more', reasonBn: '১০ বছরের বেশি ডায়াবেটিস' },
      { id: 'lt10', points: 0, labelBn: '১০ বছরের কম', labelEn: 'Less than 10 years' },
    ],
  },
  {
    id: 'hypo', no: 3, topicBn: 'সুগার কমে যাওয়া', topicIcon: 'bloodtype',
    questionBn: 'আপনার সুগার কি কখনো খুব কমে যায়?', questionEn: 'Does your sugar ever go too low?',
    hintBn: 'সুগার কমলে সাধারণত মাথা ঘোরে, ঘাম হয়, হাত কাঁপে।',
    options: [
      { id: 'unaware', points: 6.5, labelBn: 'কমে গেলেও টের পাই না', labelEn: 'It goes low but I don’t feel it', reasonBn: 'সুগার কমলে টের পান না' },
      { id: 'severe', points: 5.5, labelBn: 'সম্প্রতি খুব কমেছিল, অন্যের সাহায্য লেগেছিল', labelEn: 'Recent severe low, needed help', reasonBn: 'সম্প্রতি সুগার খুব কমে গিয়েছিল' },
      { id: 'weekly', points: 3.5, labelBn: 'সপ্তাহে কয়েকবার কমে', labelEn: 'Several times a week', reasonBn: 'প্রায়ই সুগার কমে যায়' },
      { id: 'lt1week', points: 1, labelBn: 'মাঝে মাঝে কমে (সপ্তাহে ১ বারের কম)', labelEn: 'Less than once a week', reasonBn: 'মাঝে মাঝে সুগার কমে' },
      { id: 'none', points: 0, labelBn: 'কখনো কমে না', labelEn: 'Never' },
    ],
  },
  {
    id: 'hba1c', no: 4, topicBn: 'রক্তে শর্করা নিয়ন্ত্রণ', topicIcon: 'bloodtype',
    questionBn: 'গত ৩ মাসে আপনার HbA1c কত ছিল?', questionEn: 'What was your HbA1c in the last 3 months?',
    hintBn: 'জানা না থাকলে ল্যাব রিপোর্টে “HbA1c” লেখা ঘরটি দেখুন।',
    options: [
      { id: 'lt7_5', points: 0, labelBn: '৭.৫% এর কম', labelEn: 'Below 7.5%' },
      { id: '7_5to9', points: 1, labelBn: '৭.৫% – ৯%', labelEn: '7.5 – 9%', reasonBn: 'HbA1c একটু বেশি' },
      { id: 'gt9', points: 2, labelBn: '৯% এর বেশি', labelEn: 'Above 9%', reasonBn: 'HbA1c অনেক বেশি' },
      // Not in the official table. We count "don't know" as the highest HbA1c (2 points) to stay on the safe side.
      { id: 'unknown', points: 2, labelBn: 'জানি না', labelEn: 'I don’t know', reasonBn: 'HbA1c জানা নেই' },
    ],
  },
  {
    id: 'treatment', no: 5, topicBn: 'ওষুধ', topicIcon: 'medication',
    questionBn: 'আপনি কোন ওষুধ নেন?', questionEn: 'Which medicine do you take?',
    hintBn: 'ওষুধের পাতা বা প্রেসক্রিপশন দেখে নিন।',
    options: [
      { id: 'mdi_mixed', points: 3, labelBn: 'দিনে কয়েকবার মিক্সড ইনসুলিন', labelEn: 'Mixed insulin, several times a day', reasonBn: 'দিনে কয়েকবার ইনসুলিন নেন' },
      { id: 'basal_bolus', points: 2.5, labelBn: 'খাবারের আগে + রাতে ইনসুলিন, বা পাম্প', labelEn: 'Basal-bolus insulin or pump', reasonBn: 'ইনসুলিন নেন' },
      { id: 'od_mixed', points: 2, labelBn: 'দিনে একবার মিক্সড ইনসুলিন', labelEn: 'Mixed insulin once a day', reasonBn: 'ইনসুলিন নেন' },
      { id: 'basal', points: 1.5, labelBn: 'শুধু দিনে একবার লম্বা-মেয়াদি ইনসুলিন', labelEn: 'Basal insulin only', reasonBn: 'ইনসুলিন নেন' },
      { id: 'glibenclamide', points: 1, labelBn: 'গ্লিবেনক্লামাইড', labelEn: 'Glibenclamide', reasonBn: 'সুগার কমাতে পারে এমন ট্যাবলেট' },
      { id: 'gliclazide_etc', points: 0.5, labelBn: 'গ্লিক্লাজাইড / গ্লিমেপিরাইড / রিপাগ্লিনাইড', labelEn: 'Gliclazide, glimepiride or repaglinide', reasonBn: 'সুগার কমাতে পারে এমন ট্যাবলেট' },
      { id: 'other', points: 0, labelBn: 'অন্য ট্যাবলেট (যেমন মেটফরমিন) বা শুধু খাবার নিয়ন্ত্রণ', labelEn: 'Other tablets (e.g. metformin) or diet only' },
      // Not in the official table: "don't know the name". We count the highest option of that group, to stay safe.
      { id: 'tablet_unknown', points: 1, labelBn: 'ট্যাবলেটের নাম জানি না', labelEn: 'I don’t know the tablet name', reasonBn: 'ট্যাবলেটের নাম জানা নেই' },
      { id: 'insulin_unknown', points: 3, labelBn: 'ইনসুলিনের ধরন জানি না', labelEn: 'I don’t know the insulin type', reasonBn: 'ইনসুলিন নেন' },
    ],
  },
  {
    id: 'smbg', no: 6, topicBn: 'সুগার মাপা', topicIcon: 'bloodtype',
    questionBn: 'ডাক্তার যেভাবে বলেছেন, সেভাবে কি নিজে সুগার মাপেন?', questionEn: 'Do you check your sugar as your doctor advised?',
    options: [
      { id: 'as_indicated', points: 0, labelBn: 'হ্যাঁ, নিয়মিত মাপি', labelEn: 'Yes, regularly' },
      { id: 'suboptimal', points: 1, labelBn: 'মাঝে মাঝে মাপি', labelEn: 'Sometimes', reasonBn: 'নিয়মিত সুগার মাপেন না' },
      { id: 'not_done', points: 2, labelBn: 'মাপা দরকার, কিন্তু মাপি না', labelEn: 'I should, but I don’t', reasonBn: 'সুগার মাপেন না' },
    ],
  },
  {
    id: 'acute', no: 7, topicBn: 'জরুরি জটিলতা', topicIcon: 'bloodtype',
    questionBn: 'সুগার খুব বেড়ে গিয়ে হাসপাতালে ভর্তি হয়েছিলেন?', questionEn: 'Hospital stay for very high sugar (DKA/HHS)?',
    options: [
      { id: '3m', points: 3, labelBn: 'গত ৩ মাসে', labelEn: 'In the last 3 months', reasonBn: 'সম্প্রতি সুগার খুব বেড়েছিল' },
      { id: '6m', points: 2, labelBn: 'গত ৬ মাসে', labelEn: 'In the last 6 months', reasonBn: 'সুগার খুব বেড়েছিল' },
      { id: '12m', points: 1, labelBn: 'গত ১২ মাসে', labelEn: 'In the last 12 months', reasonBn: 'সুগার খুব বেড়েছিল' },
      { id: 'none', points: 0, labelBn: 'না', labelEn: 'No' },
    ],
  },
  {
    id: 'mvd', no: 8, topicBn: 'হার্ট ও রক্তনালি', topicIcon: 'favorite',
    questionBn: 'হার্টের রোগ বা স্ট্রোক আছে?', questionEn: 'Heart disease or stroke?',
    options: [
      { id: 'none', points: 0, labelBn: 'নেই', labelEn: 'No' },
      { id: 'stable', points: 2, labelBn: 'আছে, তবে এখন স্থিতিশীল', labelEn: 'Yes, but stable', reasonBn: 'হার্টের রোগ আছে' },
      { id: 'unstable', points: 6.5, labelBn: 'আছে, সম্প্রতি সমস্যা হয়েছে', labelEn: 'Yes, recent problems', reasonBn: 'হার্টের সমস্যা স্থিতিশীল নয়' },
    ],
  },
  {
    id: 'renal', no: 9, topicBn: 'কিডনি', topicIcon: 'water_drop',
    questionBn: 'আপনার কিডনির অবস্থা কেমন?', questionEn: 'How are your kidneys?',
    hintBn: 'ল্যাব রিপোর্টে “eGFR” লেখা ঘর থাকলে সেটি দেখুন।',
    options: [
      { id: 'gt60', points: 0, labelBn: 'ভালো (eGFR ৬০ এর বেশি)', labelEn: 'Good (eGFR above 60)' },
      { id: '45to60', points: 2, labelBn: 'একটু দুর্বল (eGFR ৪৫–৬০)', labelEn: 'Mildly reduced (45–60)', reasonBn: 'কিডনি একটু দুর্বল' },
      { id: '30to45', points: 4, labelBn: 'মাঝারি দুর্বল (eGFR ৩০–৪৫)', labelEn: 'Moderately reduced (30–45)', reasonBn: 'কিডনির সমস্যা আছে' },
      { id: 'lt30', points: 6.5, labelBn: 'খুব দুর্বল (eGFR ৩০ এর কম)', labelEn: 'Severely reduced (below 30)', reasonBn: 'কিডনির গুরুতর সমস্যা' },
    ],
  },
  {
    id: 'pregnancy', no: 10, topicBn: 'গর্ভাবস্থা', topicIcon: 'pregnant_woman',
    questionBn: 'আপনি কি এখন গর্ভবতী?', questionEn: 'Are you pregnant now?',
    hintBn: 'গর্ভবতী ও স্তন্যদানকারী মায়েদের রোজা না রাখার অনুমতি আছে।',
    options: [
      { id: 'no', points: 0, labelBn: 'না', labelEn: 'No' },
      { id: 'in_target', points: 3.5, labelBn: 'হ্যাঁ, সুগার নিয়ন্ত্রণে আছে', labelEn: 'Yes, sugar in target', reasonBn: 'গর্ভবতী' },
      { id: 'not_target', points: 6.5, labelBn: 'হ্যাঁ, সুগার নিয়ন্ত্রণে নেই', labelEn: 'Yes, sugar not in target', reasonBn: 'গর্ভবতী, সুগার নিয়ন্ত্রণে নেই' },
    ],
  },
  {
    id: 'frailty', no: 11, topicBn: 'শরীর ও স্মৃতি', topicIcon: 'elderly',
    questionBn: 'নিচের কোনটা আপনার সাথে মেলে?', questionEn: 'Which one fits you?',
    options: [
      { id: 'none', points: 0, labelBn: 'কোনো সমস্যা নেই', labelEn: 'No problem' },
      { id: 'gt70_alone', points: 3.5, labelBn: 'বয়স ৭০ এর বেশি, বাসায় দেখার কেউ নেই', labelEn: 'Over 70, no help at home', reasonBn: '৭০+ বয়স, বাসায় সাহায্য নেই' },
      { id: 'frail', points: 6.5, labelBn: 'খুব দুর্বল বা স্মৃতিশক্তি কমে গেছে', labelEn: 'Very frail or memory problems', reasonBn: 'শরীর দুর্বল বা স্মৃতি কমেছে' },
    ],
  },
  {
    id: 'labour', no: 12, topicBn: 'কাজ', topicIcon: 'construction',
    questionBn: 'রোজার দিনে আপনি কতটা শারীরিক পরিশ্রম করেন?', questionEn: 'How much physical work do you do?',
    options: [
      { id: 'none', points: 0, labelBn: 'ভারী কাজ করি না', labelEn: 'No heavy work' },
      { id: 'moderate', points: 2, labelBn: 'মাঝারি পরিশ্রম', labelEn: 'Moderate work', reasonBn: 'মাঝারি শারীরিক পরিশ্রম' },
      { id: 'high', points: 4, labelBn: 'খুব ভারী কাজ (যেমন রিকশা চালানো, মাঠে কাজ)', labelEn: 'Very heavy work', reasonBn: 'খুব ভারী শারীরিক কাজ' },
    ],
  },
  {
    id: 'experience', no: 13, topicBn: 'আগের রমজান', topicIcon: 'quiz',
    questionBn: 'আগের রমজানে রোজা রেখে কি সমস্যা হয়েছিল?', questionEn: 'Problems fasting last Ramadan?',
    options: [
      { id: 'negative', points: 1, labelBn: 'হ্যাঁ, খারাপ অভিজ্ঞতা হয়েছিল', labelEn: 'Yes, a bad experience', reasonBn: 'আগের রমজানে সমস্যা হয়েছিল' },
      { id: 'neutral', points: 0, labelBn: 'না', labelEn: 'No' },
    ],
  },
  {
    id: 'hours', no: 14, topicBn: 'রোজার সময়', topicIcon: 'quiz',
    questionBn: 'রোজা কত ঘণ্টার?', questionEn: 'How long is the fast?',
    options: [
      { id: 'ge16', points: 1, labelBn: '১৬ ঘণ্টা বা বেশি', labelEn: '16 hours or more', reasonBn: 'লম্বা রোজা' },
      { id: 'lt16', points: 0, labelBn: '১৬ ঘণ্টার কম', labelEn: 'Less than 16 hours' },
    ],
  },
];

// The 8 questions we ask in the quick quiz (plus pregnancy for women), in this order.
// Left out to keep it short: duration (max 1 pt), acute complications (max 3), previous Ramadan (max 1).
// So the quick score can be up to 5 points too low; the result screen says so.
export const QUICK_QUIZ_IDS = ['pregnancy', 'hypo', 'hba1c', 'treatment', 'smbg', 'mvd', 'renal', 'frailty', 'labour'];
export const SKIPPED_MAX_POINTS = 5; // 1 + 3 + 1

export type DarAnswers = Record<string, string>; // element id -> option id

// Finds an element by id (throws if the id is wrong, so typos show up at once).
export function getElement(id: string): DarElement {
  const el = DAR_ELEMENTS.find((e) => e.id === id);
  if (!el) throw new Error(`Unknown IDF-DAR element: ${id}`);
  return el;
}

// Turns a score into a band. "Low 0–3, Moderate 3.5–6, High >6" (points go up in 0.5 steps).
export function darBand(score: number): DarBand {
  if (score <= 3) return 'low';
  if (score <= 6) return 'moderate';
  return 'high';
}

export type DarResult = {
  score: number;
  band: DarBand;
  reasons: { text: string; points: number }[]; // answers that added points, biggest first
  unanswered: string[]; // element ids with no answer (counted as 0)
};

// Adds up the points for the given answers. Unanswered elements count as 0 and are listed.
export function scoreDar(answers: DarAnswers): DarResult {
  let score = 0;
  const reasons: DarResult['reasons'] = [];
  const unanswered: string[] = [];
  for (const el of DAR_ELEMENTS) {
    const opt = el.options.find((o) => o.id === answers[el.id]);
    if (!opt) {
      unanswered.push(el.id);
      continue;
    }
    score += opt.points;
    if (opt.points > 0 && opt.reasonBn) reasons.push({ text: opt.reasonBn, points: opt.points });
  }
  reasons.sort((a, b) => b.points - a.points);
  return { score, band: darBand(score), reasons, unanswered };
}

// Which treatment options to show, based on what the user said on "About you".
// Diet only -> no question needed (answer "other"). Tablets -> tablet options. Insulin -> insulin options.
export function treatmentOptionIds(treatment: 'diet' | 'tablets' | 'insulin' | null): string[] | 'auto-other' {
  if (treatment === 'diet') return 'auto-other';
  if (treatment === 'tablets') return ['glibenclamide', 'gliclazide_etc', 'other', 'tablet_unknown'];
  if (treatment === 'insulin') return ['mdi_mixed', 'basal_bolus', 'od_mixed', 'basal', 'insulin_unknown'];
  return getElement('treatment').options.map((o) => o.id);
}
