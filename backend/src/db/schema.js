import { sql } from 'drizzle-orm';
import { check, date, foreignKey, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
}, (table) => [unique('members_group_id_id').on(table.groupId, table.id)]);

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  title: text('title').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  paidByMemberId: uuid('paid_by_member_id').notNull(),
  expenseDate: date('expense_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('expenses_group_id_id').on(table.groupId, table.id),
  check('expenses_positive_amount', sql`${table.amountPaise} > 0`),
  foreignKey({ columns: [table.groupId, table.paidByMemberId], foreignColumns: [members.groupId, members.id] }),
]);

export const expenseShares = pgTable('expense_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull(),
  expenseId: uuid('expense_id').notNull(),
  memberId: uuid('member_id').notNull(),
  sharePaise: integer('share_paise').notNull(),
}, (table) => [
  unique('expense_shares_expense_member').on(table.expenseId, table.memberId),
  check('expense_shares_nonnegative', sql`${table.sharePaise} >= 0`),
  foreignKey({ columns: [table.groupId, table.expenseId], foreignColumns: [expenses.groupId, expenses.id] }),
  foreignKey({ columns: [table.groupId, table.memberId], foreignColumns: [members.groupId, members.id] }),
]);

export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id),
  fromMemberId: uuid('from_member_id').notNull(),
  toMemberId: uuid('to_member_id').notNull(),
  amountPaise: integer('amount_paise').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('settlements_positive_amount', sql`${table.amountPaise} > 0`),
  check('settlements_different_members', sql`${table.fromMemberId} <> ${table.toMemberId}`),
  foreignKey({ columns: [table.groupId, table.fromMemberId], foreignColumns: [members.groupId, members.id] }),
  foreignKey({ columns: [table.groupId, table.toMemberId], foreignColumns: [members.groupId, members.id] }),
]);
