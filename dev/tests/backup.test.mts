// Checks lib/backup.ts. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupText } from '../../lib/backup.ts';

test('Backup text has the readable summary and the raw data at the end', () => {
  const data = {
    profile: { name: 'রহিম', age: 58, gender: 'male', diabetesType: 'type2', treatment: 'tablets', districtId: 'cumilla', familyPhone: '', reminder: true, onboarded: true } as const,
    risk: { answers: {}, score: 1.5, band: 'low', date: '2026-11-22T04:00:00.000Z' } as const,
    plans: [{ date: '2026-11-22T12:00:00.000Z', items: [{ foodId: 'jilapi', count: 1 }], walk15: true, peakNow: 12.2, peakAfter: 8.2 }],
    readings: [{ value: 5.4, date: '2026-11-22T08:00:00.000Z', when: 'other' as const }],
  };
  const text = backupText(data as any);
  assert.match(text, /নাম: রহিম · বয়স: ৫৮/);
  assert.match(text, /ঝুঁকি যাচাই: ১.৫ · কম ঝুঁকি/);
  assert.match(text, /জিলাপি ১, ১৫ মিনিট হাঁটা/);
  assert.match(text, /৫.৪ mmol\/L/);
  const json = JSON.parse(text.split('\n').at(-1)!);
  assert.equal(json.app, 'roza-safe');
  assert.equal(json.readings[0].value, 5.4);
});
