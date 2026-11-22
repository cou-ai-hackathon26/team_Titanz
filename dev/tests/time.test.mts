// Checks lib/time.ts. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayPart, hoursAndMinutes, sameDay, shortDate } from '../../lib/time.ts';

test('Day parts match the Figma labels (দুপুর ২:০০, সন্ধ্যা ৬:১২)', () => {
  assert.equal(dayPart(14 * 60), 'দুপুর');
  assert.equal(dayPart(18 * 60 + 12), 'সন্ধ্যা');
  assert.equal(dayPart(17 * 60 + 9), 'বিকাল');
  assert.equal(dayPart(4 * 60 + 55), 'সকাল');
  assert.equal(dayPart(3 * 60), 'রাত');
  assert.equal(dayPart(23 * 60), 'রাত');
});

test('Hours and minutes', () => {
  assert.deepEqual(hoursAndMinutes(138), { h: 2, m: 18 });
  assert.deepEqual(hoursAndMinutes(-5), { h: 0, m: 0 });
});

test('Dates', () => {
  assert.ok(sameDay(new Date(2026, 10, 22, 1), new Date(2026, 10, 22, 23)));
  assert.ok(!sameDay(new Date(2026, 10, 22), new Date(2026, 10, 23)));
  assert.equal(shortDate(new Date(2026, 10, 22)), '২২/১১');
});

test('reminderTime is 1 hour before iftar on that day', async () => {
  const { reminderTime } = await import('../../lib/time.ts');
  const at = reminderTime(new Date(2027, 1, 10, 9, 30), 18 * 60 + 5); // iftar 6:05 PM
  assert.equal(at.getDate(), 10);
  assert.equal(at.getHours(), 17);
  assert.equal(at.getMinutes(), 5);
});
