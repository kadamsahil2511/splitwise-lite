import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Plus, ReceiptText, Users, Wallet, X } from 'lucide-react';
import { api } from './api.js';

function money(paise) {
  const absolute = Math.abs(paise);
  return `₹${Math.floor(absolute / 100).toLocaleString('en-IN')}.${String(absolute % 100).padStart(2, '0')}`;
}

function paiseFromInput(value) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [rupees, paise = ''] = value.split('.');
  const amount = Number(rupees) * 100 + Number(paise.padEnd(2, '0'));
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 2147483647 ? amount : null;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function GroupWorkspace({ group, onAddMember }) {
  const [tab, setTab] = useState('overview');
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [ledger, setLedger] = useState({ balances: [], suggestions: [], totalExpensesPaise: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [participants, setParticipants] = useState([]);
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState('');

  async function refresh() {
    const [nextExpenses, nextLedger, nextSettlements] = await Promise.all([
      api(`/groups/${group.id}/expenses`),
      api(`/groups/${group.id}/balances`),
      api(`/groups/${group.id}/settlements`),
    ]);
    setExpenses(nextExpenses);
    setLedger(nextLedger);
    setSettlements(nextSettlements);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      api(`/groups/${group.id}/expenses`),
      api(`/groups/${group.id}/balances`),
      api(`/groups/${group.id}/settlements`),
    ]).then(([nextExpenses, nextLedger, nextSettlements]) => {
      if (!active) return;
      setExpenses(nextExpenses);
      setLedger(nextLedger);
      setSettlements(nextSettlements);
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [group.id, group.members.length]);

  const name = (id) => group.members.find((member) => member.id === id)?.name || 'Unknown member';
  const outstandingPaise = ledger.balances.filter((item) => item.balancePaise > 0).reduce((sum, item) => sum + item.balancePaise, 0);
  const history = [
    ...expenses.map((expense) => ({ type: 'expense', id: expense.id, date: expense.expenseDate, createdAt: expense.createdAt, item: expense })),
    ...settlements.map((settlement) => ({ type: 'settlement', id: settlement.id, date: settlement.createdAt.slice(0, 10), createdAt: settlement.createdAt, item: settlement })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

  function openExpense() {
    setTitle(''); setAmount(''); setPayer(group.members[0]?.id || '');
    setParticipants(group.members.map((member) => member.id));
    setDate(today()); setError(''); setExpenseOpen(true);
  }

  async function saveExpense(event) {
    event.preventDefault();
    const amountPaise = paiseFromInput(amount);
    if (!amountPaise) return setError('Enter an amount greater than ₹0 with at most two decimal places.');
    if (!participants.length) return setError('Choose at least one participant.');
    setSaving(true); setError('');
    try {
      await api(`/groups/${group.id}/expenses`, { method: 'POST', body: JSON.stringify({ title, amountPaise, paidByMemberId: payer, participantIds: participants, expenseDate: date }) });
      await refresh();
      setExpenseOpen(false);
      setTab('overview');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function markPaid(suggestion) {
    const key = `${suggestion.fromMemberId}:${suggestion.toMemberId}`;
    setSettling(key); setError('');
    try {
      await api(`/groups/${group.id}/settlements`, { method: 'POST', body: JSON.stringify(suggestion) });
      await refresh();
    } catch (err) { setError(err.message); }
    finally { setSettling(''); }
  }

  return <div className="content-wrap">
    <div className="eyebrow"><span className="eyebrow-line" /> GROUP SPACE</div>
    <div className="page-heading"><div><h1>{group.name}</h1><p>Every shared expense, clearly accounted for.</p></div><div className="heading-actions"><button className="button-secondary" onClick={onAddMember}><Plus size={17} /> Add member</button><button className="button-primary" onClick={openExpense} disabled={!group.members.length}><Plus size={18} /> Add expense</button></div></div>
    {error && !expenseOpen && <p className="alert" role="alert">{error}</p>}
    <div className="summary-grid"><div className="summary-card"><span>Total group spending</span><strong>{money(ledger.totalExpensesPaise)}</strong><small>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} recorded</small></div><div className="summary-card"><span>Still to settle</span><strong>{money(outstandingPaise)}</strong><small>{ledger.suggestions.length} suggested {ledger.suggestions.length === 1 ? 'payment' : 'payments'}</small></div><div className="summary-card"><span>People in this group</span><strong>{group.members.length}</strong><small>Sharing together</small></div></div>
    <div className="tabs" role="tablist" aria-label="Group sections">{['overview', 'settle up', 'history'].map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? 'selected' : ''} key={item} onClick={() => setTab(item)}>{item === 'settle up' ? 'Settle Up' : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    {loading ? <p className="muted" role="status">Loading group activity…</p> : tab === 'overview' ? <div className="workspace-grid"><section className="panel"><div className="panel-heading"><div><span className="mini-label">PEOPLE</span><h2>Balances</h2></div><span className="count-pill">{group.members.length} {group.members.length === 1 ? 'member' : 'members'}</span></div>{ledger.balances.length ? <div className="member-list">{ledger.balances.map((item, index) => <div className="member-row" key={item.memberId}><span className={`member-avatar tone-${index % 4}`}>{item.name.slice(0, 1).toUpperCase()}</span><span>{item.name}</span><span className={`balance ${item.balancePaise > 0 ? 'positive' : item.balancePaise < 0 ? 'negative' : ''}`}>{item.balancePaise > 0 ? `gets back ${money(item.balancePaise)}` : item.balancePaise < 0 ? `owes ${money(item.balancePaise)}` : 'settled up'}</span></div>)}</div> : <div className="empty-members"><div className="empty-icon"><Users size={25} /></div><h3>Add your people</h3><p>Members will appear here with their balances.</p><button className="button-secondary" onClick={onAddMember}>Add a member <ArrowRight size={16} /></button></div>}</section><section className="panel"><div className="panel-heading"><div><span className="mini-label">ACTIVITY</span><h2>Recent expenses</h2></div></div>{expenses.length ? expenses.slice(0, 5).map((expense) => <div className="activity-row" key={expense.id}><span className="activity-icon"><ReceiptText size={18} /></span><span className="activity-main"><strong>{expense.title}</strong><small>Paid by {name(expense.paidByMemberId)} · {expense.shares.length} sharing</small></span><span className="activity-amount">{money(expense.amountPaise)}<small>{expense.expenseDate}</small></span></div>) : <div className="empty-members"><div className="empty-icon"><ReceiptText size={25} /></div><h3>No expenses yet</h3><p>Record the first shared cost to see balances.</p><button className="button-secondary" onClick={openExpense} disabled={!group.members.length}>Add expense <ArrowRight size={16} /></button></div>}</section></div> : tab === 'settle up' ? <section className="panel section-panel"><div className="panel-heading"><div><span className="mini-label">VIRTUAL SETTLEMENTS</span><h2>Who pays whom</h2></div></div><p className="section-intro">Marking a payment records it here. No money moves through this app.</p>{ledger.suggestions.length ? ledger.suggestions.map((suggestion) => { const key = `${suggestion.fromMemberId}:${suggestion.toMemberId}`; return <div className="transfer-row" key={key}><span className="transfer-icon"><Wallet size={19} /></span><span className="transfer-text"><strong>{name(suggestion.fromMemberId)} pays {name(suggestion.toMemberId)}</strong><small>{money(suggestion.amountPaise)} outstanding</small></span><button className="button-primary" disabled={Boolean(settling)} onClick={() => markPaid(suggestion)}>{settling === key ? 'Saving…' : 'Mark Paid'} <Check size={16} /></button></div>; }) : <div className="empty-members"><div className="empty-icon"><Check size={25} /></div><h3>All settled up</h3><p>No payments are suggested for this group.</p></div>}</section> : <section className="panel section-panel"><div className="panel-heading"><div><span className="mini-label">LEDGER</span><h2>History</h2></div><span className="count-pill">{history.length} entries</span></div>{history.length ? history.map((entry) => <div className="activity-row" key={`${entry.type}-${entry.id}`}><span className="activity-icon">{entry.type === 'expense' ? <ReceiptText size={18} /> : <Wallet size={18} />}</span><span className="activity-main"><strong>{entry.type === 'expense' ? entry.item.title : `${name(entry.item.fromMemberId)} paid ${name(entry.item.toMemberId)}`}</strong><small>{entry.type === 'expense' ? `Expense · Paid by ${name(entry.item.paidByMemberId)}` : 'Settlement · Recorded payment'}</small></span><span className="activity-amount">{money(entry.item.amountPaise)}<small>{entry.date}</small></span></div>) : <div className="empty-members"><div className="empty-icon"><CalendarDays size={25} /></div><h3>No history yet</h3><p>Expenses and settlements will appear here, newest first.</p></div>}</section>}
    {expenseOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpenseOpen(false); }}><div className="modal expense-modal" role="dialog" aria-modal="true" aria-labelledby="expense-title"><button className="modal-close" aria-label="Close" onClick={() => setExpenseOpen(false)}><X size={20} /></button><div className="modal-icon"><ReceiptText size={23} /></div><h2 id="expense-title">Add an expense</h2><p>Record one shared cost. Amounts are stored in INR.</p><form onSubmit={saveExpense}><label htmlFor="expense-name">Expense title</label><input id="expense-name" autoFocus required maxLength={100} placeholder="e.g. Dinner" value={title} onChange={(event) => setTitle(event.target.value)} /><div className="form-pair"><div><label htmlFor="expense-amount">Amount (₹)</label><input id="expense-amount" inputMode="decimal" required placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><label htmlFor="expense-date">Date</label><input id="expense-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></div></div><label htmlFor="expense-payer">Paid by</label><select id="expense-payer" required value={payer} onChange={(event) => setPayer(event.target.value)}>{group.members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><fieldset><legend>Split equally between</legend><div className="participant-grid">{group.members.map((member) => <label key={member.id} className="participant"><input type="checkbox" checked={participants.includes(member.id)} onChange={() => setParticipants((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} />{member.name}</label>)}</div></fieldset>{error && <span className="form-error" role="alert">{error}</span>}<button className="button-primary modal-submit" disabled={saving}>{saving ? 'Saving…' : 'Save expense'} <ArrowRight size={17} /></button></form></div></div>}
  </div>;
}
