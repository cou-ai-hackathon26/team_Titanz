// Checks lib/dar.ts against the test cases in docs/LOGIC.md and the build report.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreDar, darBand, DAR_ELEMENTS } from '../../lib/dar.ts';

// A healthy type 2 person: every element answered with its 0-point option.
const base = {
  type: 't2', duration: 'lt10', hypo: 'none', hba1c: 'lt7_5', treatment: 'other', smbg: 'as_indicated',
  acute: 'none', mvd: 'none', renal: 'gt60', pregnancy: 'no', frailty: 'none', labour: 'none',
  experience: 'neutral', hours: 'lt16',
};

test('Case A: diet only, no hypos, HbA1c < 7.5 -> Low (0)', () => {
  const r = scoreDar(base);
  assert.equal(r.score, 0);
  assert.equal(r.band, 'low');
  assert.deepEqual(r.unanswered, []);
});

test('Case B: sulfonylurea tablets, HbA1c 7.5-9 -> Low (1.5), as the real table says', () => {
  const r = scoreDar({ ...base, hba1c: '7_5to9', treatment: 'gliclazide_etc' });
  assert.equal(r.score, 1.5);
  assert.equal(r.band, 'low');
});

test('Case B with glibenclamide and no sugar checks -> Moderate (4)', () => {
  const r = scoreDar({ ...base, hba1c: '7_5to9', treatment: 'glibenclamide', smbg: 'not_done' });
  assert.equal(r.score, 4);
  assert.equal(r.band, 'moderate');
});

test('Case C: insulin, recent severe hypo, eGFR 30-45 -> High (12)', () => {
  const r = scoreDar({ ...base, hypo: 'severe', treatment: 'basal_bolus', renal: '30to45' });
  assert.equal(r.score, 12);
  assert.equal(r.band, 'high');
  assert.equal(r.reasons[0].text, 'সম্প্রতি সুগার খুব কমে গিয়েছিল'); // biggest reason first
});

test('Band edges: 3 Low, 3.5 Moderate, 6 Moderate, 6.5 High', () => {
  assert.equal(darBand(3), 'low');
  assert.equal(darBand(3.5), 'moderate');
  assert.equal(darBand(6), 'moderate');
  assert.equal(darBand(6.5), 'high');
});

test('Official points: max per element matches Table 2', () => {
  const official = { type: 1, duration: 1, hypo: 6.5, hba1c: 2, treatment: 3, smbg: 2, acute: 3, mvd: 6.5, renal: 6.5, pregnancy: 6.5, frailty: 6.5, labour: 4, experience: 1, hours: 1 };
  for (const el of DAR_ELEMENTS) {
    assert.equal(Math.max(...el.options.map((o) => o.points)), official[el.id as keyof typeof official], el.id);
  }
});

test('Unanswered questions count 0 and are listed', () => {
  const r = scoreDar({ hypo: 'weekly' });
  assert.equal(r.score, 3.5);
  assert.equal(r.unanswered.length, DAR_ELEMENTS.length - 1);
});
