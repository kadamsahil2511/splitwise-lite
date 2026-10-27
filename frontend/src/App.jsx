import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, CircleHelp, Menu, Plus, Sparkles, Users, Wallet, X } from 'lucide-react';
import { api } from './api.js';
import GroupWorkspace from './GroupWorkspace.jsx';

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function App() {
  const [groups, setGroups] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    api('/groups').then(setGroups).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let active = true;
    setDetail(null);
    setLoading(true);
    setError('');
    api(`/groups/${selectedId}`).then((group) => { if (active) setDetail(group); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  function openModal(type) {
    setName('');
    setError('');
    setModal(type);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'group') {
        const group = await api('/groups', { method: 'POST', body: JSON.stringify({ name }) });
        setGroups((current) => [...current, group]);
        setSelectedId(group.id);
      } else {
        const member = await api(`/groups/${selectedId}/members`, { method: 'POST', body: JSON.stringify({ name }) });
        setDetail((current) => ({ ...current, members: [...current.members, member].sort((a, b) => a.name.localeCompare(b.name)) }));
      }
      setModal(null);
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Wallet size={21} strokeWidth={2.5} /></span><span>splitwise<span className="brand-dot">.</span><small>lite</small></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className={`side-link ${!selectedId ? 'active' : ''}`} onClick={() => { setSelectedId(null); setMobileNav(false); }}><span className="side-icon"><Wallet size={18} /></span> Overview <ChevronRight className="side-chevron" size={16} /></button>
      <div className="side-row"><span className="side-label">YOUR GROUPS</span><button aria-label="Create group" className="side-add" onClick={() => openModal('group')}><Plus size={16} /></button></div>
      <nav aria-label="Groups" className="group-nav">
        {groups.map((group, i) => <button key={group.id} className={`side-link group-link ${selectedId === group.id ? 'active' : ''}`} onClick={() => { setSelectedId(group.id); setMobileNav(false); }}><span className={`group-icon tone-${i % 4}`}>{initials(group.name)}</span><span className="truncate">{group.name}</span><ChevronRight className="side-chevron" size={16} /></button>)}
        {!groups.length && <p className="side-empty">Your groups will appear here.</p>}
      </nav>
      <div className="side-bottom"><CircleHelp size={17} /><span>Virtual records only<br /><strong>No payments are made here</strong></span></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" aria-label={mobileNav ? 'Close menu' : 'Open menu'} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X size={22} /> : <Menu size={22} />}</button><span className="breadcrumb">Workspace <ChevronRight size={15} /> <strong>{detail?.name || 'Overview'}</strong></span><div className="top-avatar" aria-label="Demo workspace">SW</div></header>
      {selectedId ? detail ? <><GroupWorkspace group={detail} onAddMember={() => openModal('member')} />{error && !modal && <p className="alert app-alert" role="alert">{error}</p>}</> : <div className="content-wrap">{error ? <p className="alert" role="alert">{error}</p> : <p className="muted">Loading group…</p>}</div> : <div className="content-wrap">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR DASHBOARD</div>
        <div className="page-heading"><div><h1>Make shared money<br /><em>feel simple.</em></h1><p>Keep every group together, and every person in the loop.</p></div><button className="button-primary" onClick={() => openModal('group')}><Plus size={18} /> New group</button></div>
        {error && !modal && <p className="alert" role="alert">{error}</p>}
        <div className="hero"><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> A simpler way to share</span><h2>Good times together.<br />Clear tabs afterward.</h2><p>Start a group for your next trip, flat, or dinner. Add everyone now, then track expenses as the app grows.</p><button onClick={() => openModal('group')}>Create your first group <ArrowRight size={17} /></button></div><div className="hero-art" aria-hidden="true"><div className="art-card art-card-back"><span>WEEKEND TRIP</span><div className="art-avatars"><b>AS</b><b>BK</b><b>CR</b></div></div><div className="art-card art-card-front"><span className="art-card-icon"><Wallet size={22} /></span><span>BETTER TOGETHER</span><strong>Split the fun.<br />Keep it fair.</strong><i>₹</i></div><div className="art-spark">✦</div></div></div>
        <div className="section-heading"><div><span className="mini-label">YOUR SPACE</span><h2>Groups <span>{groups.length}</span></h2></div><span className="section-caption">All your shared circles in one place</span></div>
        {loading ? <p className="muted">Loading groups…</p> : groups.length ? <div className="group-grid">{groups.map((group, i) => <button className="group-card" key={group.id} onClick={() => setSelectedId(group.id)}><span className={`card-icon tone-${i % 4}`}>{initials(group.name)}</span><span className="group-card-text"><strong>{group.name}</strong><small>Open group <ArrowRight size={14} /></small></span><ChevronRight size={20} className="card-chevron" /></button>)}</div> : <div className="empty-groups"><span className="empty-groups-icon"><Users size={25} /></span><div><h3>No groups yet</h3><p>Create a group for a trip, flat, or dinner to get started.</p></div><button className="button-secondary" onClick={() => openModal('group')}>Create group <ArrowRight size={16} /></button></div>}
      </div>}
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" aria-label="Close" onClick={() => setModal(null)}><X size={20} /></button><div className="modal-icon">{modal === 'group' ? <Wallet size={23} /> : <Users size={23} />}</div><h2 id="modal-title">{modal === 'group' ? 'Create a group' : 'Add a member'}</h2><p>{modal === 'group' ? 'Give your shared space a name. You can add people right after.' : `Add someone to ${detail?.name || 'this group'}.`}</p><form onSubmit={save}><label htmlFor="name">{modal === 'group' ? 'Group name' : 'Member name'}</label><input id="name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={modal === 'group' ? 'e.g. Goa getaway' : 'e.g. Asha'} maxLength={100} required />{error && <span className="form-error" role="alert">{error}</span>}<button className="button-primary modal-submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : modal === 'group' ? 'Create group' : 'Add member'} <ArrowRight size={17} /></button></form></div></div>}
  </div>;
}
