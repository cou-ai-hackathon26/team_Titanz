// Checks lib/phone.ts. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidPhone, formatPhone, cleanPhoneInput } from '../../lib/phone.ts';

test('Phone numbers: typed with 0, +880 or Bangla digits all work', () => {
  assert.equal(cleanPhoneInput('01819234567'), '1819234567');
  assert.equal(cleanPhoneInput('+880 1819-234567'), '1819234567');
  assert.equal(cleanPhoneInput('০১৮১৯২৩৪৫৬৭'), '1819234567');
  assert.ok(isValidPhone('1819234567'));
  assert.ok(!isValidPhone('1219234567'));
  assert.ok(!isValidPhone('181923456'));
  assert.equal(formatPhone('1819234567'), '১৮১৯ ২৩৪ ৫৬৭');
});

test('phoneProblem explains what is wrong', async () => {
  const { phoneProblem } = await import('../../lib/phone.ts');
  assert.equal(phoneProblem(''), null);
  assert.equal(phoneProblem('1819234567'), null);
  assert.match(phoneProblem('464649464')!, /১ দিয়ে শুরু/);
  assert.match(phoneProblem('1219234567')!, /বাংলাদেশের মোবাইল নম্বর নয়/);
  assert.match(phoneProblem('18192')!, /আরও ৫টি সংখ্যা/);
});
