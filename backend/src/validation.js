export function cleanName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Name is required');
  }
  return value.trim();
}

function positivePaise(value) {
  return Number.isInteger(value) && value > 0 && value <= 2147483647;
}

export function validateExpense(body, members) {
  const title = cleanName(body?.title);
  if (!positivePaise(body?.amountPaise)) throw new Error('Amount must be a positive number of paise');
  const memberIds = new Set(members.map((member) => member.id));
  if (!memberIds.has(body?.paidByMemberId)) throw new Error('Payer must belong to this group');
  if (!Array.isArray(body?.participantIds) || !body.participantIds.length) throw new Error('Choose at least one participant');
  if (new Set(body.participantIds).size !== body.participantIds.length) throw new Error('Duplicate participants are not allowed');
  if (body.participantIds.some((id) => !memberIds.has(id))) throw new Error('Participants must belong to this group');
  const date = body?.expenseDate;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error('Enter a valid expense date');
  return { title, amountPaise: body.amountPaise, paidByMemberId: body.paidByMemberId, participantIds: body.participantIds, expenseDate: date };
}

export function validateSettlement(body, suggestions) {
  if (!positivePaise(body?.amountPaise)) throw new Error('Settlement amount must be positive paise');
  const suggestion = suggestions.find(({ fromMemberId, toMemberId }) => fromMemberId === body.fromMemberId && toMemberId === body.toMemberId);
  if (!suggestion || body.amountPaise > suggestion.amountPaise) throw new Error('Settlement exceeds the outstanding debt for this pair');
  return { fromMemberId: body.fromMemberId, toMemberId: body.toMemberId, amountPaise: body.amountPaise };
}
