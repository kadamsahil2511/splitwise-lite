import test from 'node:test';
import assert from 'node:assert/strict';
import { splitExpense, calculateBalances, suggestSettlements } from './ledger.js';

test('₹100 split among three assigns the leftover paisa by ID', () => {
  assert.deepEqual(splitExpense(10000, ['c', 'a', 'b']), [
    { memberId: 'a', sharePaise: 3334 },
    { memberId: 'b', sharePaise: 3333 },
    { memberId: 'c', sharePaise: 3333 },
  ]);
});

test('BRD example balances and suggestions clear exactly', () => {
  const members = ['a', 'b', 'c'].map((id) => ({ id, name: id }));
  const expenses = [{ id: 'dinner', paidByMemberId: 'a', amountPaise: 90000 }, { id: 'cab', paidByMemberId: 'b', amountPaise: 30000 }];
  const shares = expenses.flatMap((expense) => splitExpense(expense.amountPaise, ['a', 'b', 'c']).map((share) => ({ ...share, expenseId: expense.id })));
  const balances = calculateBalances(members, expenses, shares, []);
  assert.deepEqual(balances.map(({ balancePaise }) => balancePaise), [50000, -10000, -40000]);
  assert.deepEqual(suggestSettlements(balances), [
    { fromMemberId: 'b', toMemberId: 'a', amountPaise: 10000 },
    { fromMemberId: 'c', toMemberId: 'a', amountPaise: 40000 },
  ]);
  const settled = calculateBalances(members, expenses, shares, suggestSettlements(balances));
  assert.deepEqual(settled.map(({ balancePaise }) => balancePaise), [0, 0, 0]);
  assert.deepEqual(suggestSettlements(settled), []);
});

test('payer can pay only for another member; single-person share nets to zero', () => {
  const members = [{ id: 'a', name: 'Asha' }, { id: 'b', name: 'Bharat' }];
  const expense = { id: 'e', paidByMemberId: 'a', amountPaise: 100 };
  assert.deepEqual(calculateBalances(members, [expense], [{ expenseId: 'e', memberId: 'b', sharePaise: 100 }], []).map(({ balancePaise }) => balancePaise), [100, -100]);
  assert.deepEqual(calculateBalances(members, [expense], [{ expenseId: 'e', memberId: 'a', sharePaise: 100 }], []).map(({ balancePaise }) => balancePaise), [0, 0]);
});
