import express from 'express';
import cors from 'cors';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from './db/client.js';
import { groups, members, expenses, expenseShares, settlements } from './db/schema.js';
import { calculateBalances, splitExpense, suggestSettlements } from './ledger.js';
import { cleanName, validateExpense, validateSettlement } from './validation.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') || false }));
app.use(express.json());
app.get('/health', async (_req, res) => {
  await db.execute(sql`select 1`);
  res.json({ status: 'ok' });
});
app.param('id', async (req, res, next, id) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(404).json({ error: 'Group not found' });
  }
  const [group] = await db.select().from(groups).where(eq(groups.id, id));
  if (!group) return res.status(404).json({ error: 'Group not found' });
  req.group = group;
  next();
});

async function ledger(connection, groupId) {
  const groupMembers = await connection.select().from(members).where(eq(members.groupId, groupId)).orderBy(members.name);
  const groupExpenses = await connection.select().from(expenses).where(eq(expenses.groupId, groupId));
  const shares = await connection.select().from(expenseShares).where(eq(expenseShares.groupId, groupId));
  const groupSettlements = await connection.select().from(settlements).where(eq(settlements.groupId, groupId));
  const balances = calculateBalances(groupMembers, groupExpenses, shares, groupSettlements);
  return { balances, suggestions: suggestSettlements(balances), totalExpensesPaise: groupExpenses.reduce((sum, expense) => sum + expense.amountPaise, 0) };
}

app.get('/api/groups', async (_req, res) => {
  res.json(await db.select().from(groups).orderBy(groups.createdAt));
});

app.post('/api/groups', async (req, res) => {
  try {
    const [group] = await db.insert(groups).values({ name: cleanName(req.body?.name) }).returning();
    res.status(201).json(group);
  } catch (error) {
    if (error.message === 'Name is required') return res.status(400).json({ error: error.message });
    throw error;
  }
});

app.get('/api/groups/:id', async (req, res) => {
  const groupMembers = await db.select().from(members).where(eq(members.groupId, req.group.id)).orderBy(members.name);
  res.json({ ...req.group, members: groupMembers });
});

app.post('/api/groups/:id/members', async (req, res) => {
  let name;
  try {
    name = cleanName(req.body?.name);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const [member] = await db.insert(members).values({ groupId: req.group.id, name }).returning();
  res.status(201).json(member);
});

app.get('/api/groups/:id/expenses', async (req, res) => {
  const result = await db.transaction(async (tx) => {
    const groupExpenses = await tx.select().from(expenses).where(eq(expenses.groupId, req.group.id)).orderBy(desc(expenses.expenseDate), desc(expenses.createdAt), desc(expenses.id));
    const shares = await tx.select().from(expenseShares).where(eq(expenseShares.groupId, req.group.id));
    return groupExpenses.map((expense) => ({ ...expense, shares: shares.filter((share) => share.expenseId === expense.id) }));
  }, { isolationLevel: 'repeatable read', readOnly: true });
  res.json(result);
});

app.post('/api/groups/:id/expenses', async (req, res) => {
  const groupMembers = await db.select().from(members).where(eq(members.groupId, req.group.id));
  let input;
  try {
    input = validateExpense(req.body, groupMembers);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const saved = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from groups where id = ${req.group.id} for update`);
    const [expense] = await tx.insert(expenses).values({ groupId: req.group.id, title: input.title, amountPaise: input.amountPaise, paidByMemberId: input.paidByMemberId, expenseDate: input.expenseDate }).returning();
    const shares = await tx.insert(expenseShares).values(splitExpense(input.amountPaise, input.participantIds).map((share) => ({ ...share, groupId: req.group.id, expenseId: expense.id }))).returning();
    return { ...expense, shares };
  });
  res.status(201).json(saved);
});

app.get('/api/groups/:id/balances', async (req, res) => {
  res.json(await db.transaction((tx) => ledger(tx, req.group.id), { isolationLevel: 'repeatable read', readOnly: true }));
});

app.get('/api/groups/:id/settlements', async (req, res) => {
  res.json(await db.select().from(settlements).where(eq(settlements.groupId, req.group.id)).orderBy(desc(settlements.createdAt), desc(settlements.id)));
});

app.post('/api/groups/:id/settlements', async (req, res) => {
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select id from groups where id = ${req.group.id} for update`);
    const { suggestions } = await ledger(tx, req.group.id);
    let input;
    try {
      input = validateSettlement(req.body, suggestions);
    } catch (error) {
      return { error: error.message };
    }
    const [settlement] = await tx.insert(settlements).values({ ...input, groupId: req.group.id }).returning();
    return { settlement };
  });
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result.settlement);
});

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON request body' });
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(Number(process.env.PORT) || 3001, process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`API listening on http://localhost:${Number(process.env.PORT) || 3001}`);
});
