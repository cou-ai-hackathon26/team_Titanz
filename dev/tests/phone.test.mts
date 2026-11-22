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
