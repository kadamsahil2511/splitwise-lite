import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanName, validateExpense, validateSettlement } from './validation.js';

test('names are trimmed and cannot be blank', () => {
  assert.equal(cleanName('  Goa trip  '), 'Goa trip');
  assert.throws(() => cleanName('  '), /name/i);
  assert.throws(() => cleanName(null), /name/i);
});

const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const expense = { title: 'Dinner', amountPaise: 10000, paidByMemberId: 'a', participantIds: ['a', 'b'], expenseDate: '2026-10-27' };

test('expense input rejects invalid members, amount, date, and duplicates', () => {
  assert.equal(validateExpense(expense, members).title, 'Dinner');
  for (const changes of [
    { amountPaise: 0 }, { amountPaise: 1.5 }, { amountPaise: 2147483648 },
    { paidByMemberId: 'outside' }, { participantIds: [] },
    { participantIds: ['a', 'a'] }, { participantIds: ['a', 'outside'] },
    { expenseDate: '2026-02-30' }, { title: ' ' },
  ]) assert.throws(() => validateExpense({ ...expense, ...changes }, members));
});

test('settlement input allows a partial suggested payment but rejects overpayment and wrong pair', () => {
  const suggestions = [{ fromMemberId: 'b', toMemberId: 'a', amountPaise: 10000 }];
  assert.equal(validateSettlement({ fromMemberId: 'b', toMemberId: 'a', amountPaise: 5000 }, suggestions).amountPaise, 5000);
  for (const body of [
    { fromMemberId: 'b', toMemberId: 'a', amountPaise: 10001 },
    { fromMemberId: 'b', toMemberId: 'a', amountPaise: 0 },
    { fromMemberId: 'a', toMemberId: 'b', amountPaise: 100 },
    { fromMemberId: 'b', toMemberId: 'c', amountPaise: 100 },
  ]) assert.throws(() => validateSettlement(body, suggestions));
});
