export function splitExpense(amountPaise, participantIds) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || !participantIds.length) throw new Error('Invalid expense split');
  const sorted = [...participantIds].sort();
  const base = Math.floor(amountPaise / sorted.length);
  const remainder = amountPaise % sorted.length;
  return sorted.map((memberId, index) => ({ memberId, sharePaise: base + Number(index < remainder) }));
}

export function calculateBalances(members, expenses, shares, settlements) {
  const balances = new Map(members.map((member) => [member.id, 0]));
  for (const expense of expenses) balances.set(expense.paidByMemberId, balances.get(expense.paidByMemberId) + expense.amountPaise);
  for (const share of shares) balances.set(share.memberId, balances.get(share.memberId) - share.sharePaise);
  for (const settlement of settlements) {
    balances.set(settlement.fromMemberId, balances.get(settlement.fromMemberId) + settlement.amountPaise);
    balances.set(settlement.toMemberId, balances.get(settlement.toMemberId) - settlement.amountPaise);
  }
  return members.map((member) => ({ memberId: member.id, name: member.name, balancePaise: balances.get(member.id) }));
}

export function suggestSettlements(balances) {
  const debtors = balances.filter((item) => item.balancePaise < 0).map((item) => ({ id: item.memberId, remaining: -item.balancePaise })).sort((a, b) => a.id.localeCompare(b.id));
  const creditors = balances.filter((item) => item.balancePaise > 0).map((item) => ({ id: item.memberId, remaining: item.balancePaise })).sort((a, b) => a.id.localeCompare(b.id));
  const suggestions = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountPaise = Math.min(debtor.remaining, creditor.remaining);
    suggestions.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amountPaise });
    debtor.remaining -= amountPaise;
    creditor.remaining -= amountPaise;
    if (!debtor.remaining) debtorIndex++;
    if (!creditor.remaining) creditorIndex++;
  }
  return suggestions;
}
