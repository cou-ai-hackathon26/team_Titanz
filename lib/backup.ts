// Builds a readable backup of everything the app saved, to share (WhatsApp, email, Drive…).
// The raw data is added at the end as JSON so it can be restored later.
import type { Profile, RiskRecord, MealPlan, Reading } from './storage.ts';
import { FOOD_BY_ID } from './foods.ts';
import { toBanglaDigits } from './bangla.ts';

export type BackupData = { profile: Profile; risk: RiskRecord | null; plans: MealPlan[]; readings: Reading[] };

const bandBn = { low: 'কম ঝুঁকি', moderate: 'মাঝারি ঝুঁকি', high: 'উচ্চ ঝুঁকি' };

// "২২/১১/২০২৬ ১০:৪৭" from an ISO date, in Bangla digits.
function dateBn(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return toBanglaDigits(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`);
}

// The whole backup as one text message.
export function backupText(data: BackupData, now = new Date()): string {
  const { profile, risk, plans, readings } = data;
  const lines: string[] = [
    'রোজা-সেফ · ব্যাকআপ রিপোর্ট (Roza-Safe backup)',
    `তৈরি: ${dateBn(now.toISOString())}`,
    '',
    `নাম: ${profile.name || '—'} · বয়স: ${profile.age ? toBanglaDigits(profile.age) : '—'}`,
    `ঝুঁকি যাচাই: ${risk ? `${toBanglaDigits(risk.score)} · ${bandBn[risk.band]} (${dateBn(risk.date)})` : 'এখনো করা হয়নি'}`,
    '',
    `ইফতার পরিকল্পনা (${toBanglaDigits(plans.length)}টি):`,
    ...plans.map((p) => {
      const foods = p.items.map((i) => `${FOOD_BY_ID[i.foodId]?.nameBn ?? i.foodId} ${toBanglaDigits(i.count)}`).join(', ');
      const peak = `${toBanglaDigits(p.peakNow.toFixed(1))} → ${toBanglaDigits(p.peakAfter.toFixed(1))} mmol/L`;
      return `• ${dateBn(p.date)} — ${foods}${p.walk15 ? ', ১৫ মিনিট হাঁটা' : ''} — সর্বোচ্চ সুগার প্রায় ${peak}`;
    }),
    '',
    `সুগারের মাপ (${toBanglaDigits(readings.length)}টি):`,
    ...readings.map((r) => `• ${dateBn(r.date)} — ${toBanglaDigits(r.value.toFixed(1))} mmol/L`),
    '',
    'স্ক্রিনিং সহায়তা, চিকিৎসকের বিকল্প নয় · Screening support only',
    '',
    '--- ডেটা (JSON, পরে ফেরত আনার জন্য) ---',
    JSON.stringify({ app: 'roza-safe', version: 1, ...data }),
  ];
  return lines.join('\n');
}
