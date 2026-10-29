import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Bell, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, CloudSun, FileCheck2, History, LayoutDashboard,
  Leaf, ListOrdered, LogOut, Menu, MapPin, RefreshCw, ShieldCheck, Sprout,
  Ticket, Tractor, User, Users, WalletCards, Wifi, X, Zap
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const WS_BASE = API_BASE.replace(/^http/, 'ws');
const TOKEN_KEY = 'sfpms_access_token';
const USER_KEY = 'sfpms_user';
const BOOKING_KEY = 'sfpms_booking';
const LISTINGS_KEY = 'sfpms_listings';

const DEMOS = {
  farmer: { phone: '9000000001', password: '123456' },
  field_agent: { phone: '9000000002', password: '123456' },
  procurement_officer: { phone: '9000000003', password: '123456' }
};

const SLOTS = [
  { id: 1, centre: 'Centre A', centreId: 101, time: '10:00 AM', capacity: 5 },
  { id: 2, centre: 'Centre A', centreId: 101, time: '11:00 AM', capacity: 5 },
  { id: 3, centre: 'Centre B', centreId: 102, time: '10:00 AM', capacity: 5 }
];

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const message = data?.detail || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(BOOKING_KEY); window.location.href = '/login'; }

function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];
    const resize = () => { canvas.width = window.innerWidth * devicePixelRatio; canvas.height = window.innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); particles = Array.from({length: 42}, () => ({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.8+.5,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25})); };
    const draw = () => { ctx.clearRect(0,0,innerWidth,innerHeight); for (const p of particles) { p.x += p.vx; p.y += p.vy; if(p.x<0||p.x>innerWidth)p.vx*=-1; if(p.y<0||p.y>innerHeight)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(110,255,177,.35)'; ctx.fill(); } raf=requestAnimationFrame(draw); };
    resize(); draw(); window.addEventListener('resize',resize); return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};
  }, []);
  return <canvas className="particles" ref={canvasRef}/>;
}

function TiltCard({children, className=''}) {
  const ref = useRef(null);
  const move = e => { const el=ref.current; if(!el)return; const r=el.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5; el.style.transform=`perspective(900px) rotateX(${-y*3}deg) rotateY(${x*4}deg) translateY(-2px)`; };
  const leave=()=>{if(ref.current)ref.current.style.transform=''};
  return <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`tilt-card ${className}`}>{children}</div>;
}

function Toast({message,onClose}) { useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t)},[onClose]); return <div className="toast"><CheckCircle2 size={18}/><span>{message}</span><button onClick={onClose}><X size={15}/></button></div> }

function App() {
  const [user,setUser]=useState(loadJson(USER_KEY,null));
  const [toast,setToast]=useState('');
  useEffect(()=>{ window.__sfpmsToast = setToast; return()=>delete window.__sfpmsToast; },[]);
  if (!user) return <Auth onLogin={u=>setUser(u)} />;
  return <Shell user={user} onLogout={logout}><Dashboard user={user}/></Shell>;
}

function Auth({onLogin}) {
  const [mode,setMode]=useState('login');
  const [phone,setPhone]=useState('9000000001');
  const [password,setPassword]=useState('123456');
  const [name,setName]=useState('');
  const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const submit=async e=>{e.preventDefault();setError('');setLoading(true);try{ if(mode==='register'){const u=await api('/auth/register',{method:'POST',body:JSON.stringify({phone,name,password})}); window.__sfpmsToast?.('Account created. Please log in.'); setMode('login'); } else {const data=await api('/auth/login',{method:'POST',body:JSON.stringify({phone,password})}); localStorage.setItem(TOKEN_KEY,data.access_token); const u=await api('/auth/me'); saveJson(USER_KEY,u); onLogin(u); } }catch(err){setError(err.message)}finally{setLoading(false)}};
  const demo=role=>{setPhone(DEMOS[role].phone);setPassword(DEMOS[role].password);setMode('login')};
  return <div className="auth-shell"><Particles/><div className="auth-orbit orbit-a"/><div className="auth-orbit orbit-b"/><div className="auth-content">
    <div className="auth-brand"><div className="brand-mark"><Sprout/></div><div><b>SFPMS</b><span>Smart Farmer Procurement</span></div></div>
    <div className="auth-grid"><div className="auth-copy"><div className="live-pill"><span/> SMART AUTOMATION</div><h1>From farm gate to <em>fair payment.</em></h1><p>A real-time procurement layer that helps farmers book, arrive, get graded and track their token without standing in uncertainty.</p><div className="feature-row"><span><Wifi/> Live queue</span><span><ShieldCheck/> Verified grading</span><span><Zap/> Fast status</span></div></div>
      <form className="auth-card glass" onSubmit={submit}><div className="auth-card-head"><div><span className="kicker">{mode==='login'?'WELCOME BACK':'NEW FARMER'}</span><h2>{mode==='login'?'Sign in':'Create account'}</h2></div><div className="mini-sprout"><Sprout size={18}/></div></div>
        {mode==='register'&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" required/></label>}
        <label>Mobile number<input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="numeric" placeholder="10–15 digit mobile" required/></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Minimum 6 characters" required/></label>
        {error&&<div className="error-box">{error}</div>}
        <button className="primary big" disabled={loading}>{loading?<><RefreshCw className="spin"/> Working…</>:mode==='login'?'Enter farmer portal':'Create account'}<ArrowRight size={18}/></button>
        {mode==='login'&&<div className="demo-box"><b>Hackathon demo accounts</b><div><button type="button" onClick={()=>demo('farmer')}>Farmer</button><button type="button" onClick={()=>demo('field_agent')}>Field agent</button><button type="button" onClick={()=>demo('procurement_officer')}>Officer</button></div></div>}
        <button type="button" className="switch" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Need an account? Register':'Already registered? Sign in'}</button>
      </form></div>
    </div></div>
}

function Shell({user,onLogout,children}) {
  const [open,setOpen]=useState(false); const location=useLocation(); const navigate=useNavigate();
  const farmerNav=[['/dashboard','Dashboard',LayoutDashboard],['/book-slot','Book Slot',CalendarDays],['/crops','My Crops',Sprout],['/queue','Live Queue',ListOrdered],['/quality','Quality Check',FileCheck2],['/payments','Payments',WalletCards],['/history','History',History]];
  const opsNav=[['/operations','Operations',BarChart3],['/queue','Live Queue',ListOrdered],['/quality','Quality Check',FileCheck2]];
  const nav=user.role==='farmer'?farmerNav:opsNav;
  const go=p=>{navigate(p);setOpen(false)};
  return <div className="app-shell"><div className="ambient ambient-1"/><div className="ambient ambient-2"/>
    <aside className={`sidebar ${open?'open':''}`}><div className="sidebar-brand"><div className="brand-mark small"><Sprout size={18}/></div><div><b>SFPMS</b><span>Procurement OS</span></div><button className="icon-btn mobile" onClick={()=>setOpen(false)}><X/></button></div>
      <div className="profile-mini"><div className="avatar">{initials(user.name)}</div><div><b>{user.name}</b><span>{prettyRole(user.role)}</span></div></div>
      <nav>{nav.map(([path,label,Icon])=><button key={path} className={location.pathname===path?'active':''} onClick={()=>go(path)}><Icon size={18}/><span>{label}</span><ChevronRight size={15}/></button>)}</nav>
      <div className="sidebar-bottom"><div className="secure"><ShieldCheck size={17}/><div><b>Secure session</b><span>JWT authenticated</span></div></div><button className="logout" onClick={onLogout}><LogOut size={17}/> Sign out</button></div>
    </aside>
    <main className="main"><header className="topbar"><button className="icon-btn mobile menu" onClick={()=>setOpen(true)}><Menu/></button><div><span className="kicker">{prettyRole(user.role).toUpperCase()} PORTAL</span><h2>{pageTitle(location.pathname)}</h2></div><div className="top-actions"><div className="connection"><span/> API <b>8001</b></div><button className="icon-btn"><Bell size={18}/></button><div className="top-avatar">{initials(user.name)}</div></div></header><div className="page-wrap">{children}</div></main>
  </div>
}

function Dashboard({user}) { const navigate=useNavigate(); if(user.role!=='farmer') return <Operations user={user}/>; const booking=loadJson(BOOKING_KEY,null); const listings=loadJson(LISTINGS_KEY,[]); const [queue,setQueue]=useState(null); const [quality,setQuality]=useState(null); const [loading,setLoading]=useState(false);
  useEffect(()=>{let alive=true;(async()=>{if(!booking)return;try{const q=await api(`/queue/status/${booking.id}`);if(alive)setQueue(q);const qc=await api(`/quality/${booking.listing_id}`).catch(()=>null);if(alive)setQuality(qc)}catch{} })();return()=>{alive=false}},[booking?.id,booking?.listing_id]);
  return <div><div className="hero-header"><div><div className="live-pill dark"><span/> SYSTEM ONLINE</div><h1>Good evening, <em>{user.name.split(' ')[0]}.</em></h1><p>Your procurement journey, in one calm place.</p></div><button className="primary" onClick={()=>navigate('/book-slot')}><CalendarDays size={18}/> Book a slot <ArrowRight size={16}/></button></div>
    <div className="dashboard-grid"><TiltCard className="hero-status"><div className="status-top"><div><span className="kicker">NEXT PROCUREMENT</span><h2>{booking?`Token #${booking.token_number}`:'No active booking'}</h2><p>{booking?`${centreName(booking.slot_id)} · ${slotTime(booking.slot_id)}`:'Reserve a time when you are ready.'}</p></div><div className="glow-icon"><Ticket/></div></div>{booking?<><div className="progress"><span style={{width:`${Math.min(100,Math.max(6,(queue?.current_token||1)/(booking.token_number||1)*100))}%`}}/></div><div className="status-meta"><span>Now serving <b>#{queue?.current_token??'—'}</b></span><span><b>{queue?.people_ahead??'—'}</b> ahead</span><span><b>{queue?.estimated_wait_minutes??'—'} min</b> wait</span></div><button className="ghost" onClick={()=>navigate('/queue')}>Open live queue <ArrowRight size={16}/></button></>:<button className="ghost" onClick={()=>navigate('/book-slot')}>Start booking <ArrowRight size={16}/></button>}</TiltCard>
      <div className="stat-stack"><TiltCard className="metric"><div className="metric-icon mint"><Sprout/></div><div><span>Registered crops</span><strong>{listings.length}</strong></div><ArrowRight/></TiltCard><TiltCard className="metric"><div className="metric-icon blue"><FileCheck2/></div><div><span>Quality status</span><strong>{quality?.grade||'Pending'}</strong></div><ArrowRight/></TiltCard><TiltCard className="metric"><div className="metric-icon amber"><CircleDollarSign/></div><div><span>Procurement</span><strong>{booking?'In progress':'—'}</strong></div><ArrowRight/></TiltCard></div></div>
    <div className="section-head"><div><span className="kicker">YOUR WORKFLOW</span><h2>Everything at a glance</h2></div></div>
    <div className="quick-cards"><Quick title="Register crop" text="Add produce before booking." icon={Sprout} onClick={()=>navigate('/crops')}/><Quick title="Book a slot" text="Choose centre and time." icon={CalendarDays} onClick={()=>navigate('/book-slot')}/><Quick title="Track queue" text="See people ahead and ETA." icon={ListOrdered} onClick={()=>navigate('/queue')}/><Quick title="View grading" text="See authorizer's quality result." icon={FileCheck2} onClick={()=>navigate('/quality')}/></div>
    <div className="info-banner"><div className="banner-icon"><CloudSun/></div><div><b>Arrive when your token is close.</b><span>Live queue updates help reduce waiting at the procurement centre.</span></div><button onClick={()=>navigate('/queue')}>Track token <ArrowRight size={15}/></button></div>
  </div>
}

function Quick({title,text,icon:Icon,onClick}){return <TiltCard className="quick" onClick={onClick}><div className="quick-icon"><Icon/></div><div><b>{title}</b><span>{text}</span></div><ArrowRight/></TiltCard>}

function BookSlot(){const navigate=useNavigate();const [listings,setListings]=useState(loadJson(LISTINGS_KEY,[]));const [listingId,setListingId]=useState(listings[0]?.id||'');const [slotId,setSlotId]=useState(1);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const submit=async()=>{setError('');if(!listingId){setError('Register a crop first.');return}setLoading(true);try{const booking=await api('/slots/book',{method:'POST',body:JSON.stringify({listing_id:Number(listingId),slot_id:Number(slotId)})});saveJson(BOOKING_KEY,booking);window.__sfpmsToast?.(`Booking confirmed — token #${booking.token_number}`);navigate('/confirmation')}catch(e){setError(e.message)}finally{setLoading(false)}};
 return <Page title="Book procurement slot" subtitle="Pick a centre and time. Your token is generated by the backend." badge="SMART SCHEDULING"><div className="form-layout"><div className="glass form-card"><div className="form-section"><label>Crop listing<select value={listingId} onChange={e=>setListingId(e.target.value)}><option value="">Select a registered crop</option>{listings.map(l=><option key={l.id} value={l.id}>#{l.id} · {l.crop} · {l.quantity_kg} kg</option>)}</select></label><div className="field-note">Only crops registered with this backend can be booked.</div></div><div className="form-section"><label>Procurement centre & time</label><div className="slot-grid modern">{SLOTS.map(s=><button type="button" key={s.id} className={Number(slotId)===s.id?'slot selected':'slot'} onClick={()=>setSlotId(s.id)}><div><MapPin size={15}/><b>{s.centre}</b></div><strong>{s.time}</strong><span>{s.capacity} capacity · Slot #{s.id}</span></button>)}</div></div>{error&&<div className="error-box">{error}</div>}<button className="primary big" onClick={submit} disabled={loading||!listingId}>{loading?<><RefreshCw className="spin"/> Booking…</>:<>Generate token <Ticket size={18}/></>}</button></div><div className="glass side-card"><div className="side-orb"><Ticket/></div><span className="kicker">WHAT HAPPENS NEXT</span><h3>One booking. One token. Less waiting.</h3><ol><li><b>Book</b><span>Backend validates your crop and slot.</span></li><li><b>Token</b><span>A unique queue token is generated.</span></li><li><b>Track</b><span>Watch current token and ETA live.</span></li><li><b>Grade</b><span>Authorizer records quality at the centre.</span></li></ol></div></div></Page>}

function Confirmation(){const navigate=useNavigate();const booking=loadJson(BOOKING_KEY,null);return <div className="success-page"><div className="success-ring"><CheckCircle2/></div><span className="kicker">BOOKING CONFIRMED</span><h1>You're in the queue.</h1><p>Your token was generated by the procurement backend.</p><div className="token-hero glass"><span>Your token</span><strong>#{booking?.token_number??'—'}</strong><div><MapPin/> {centreName(booking?.slot_id)} <i/> <Clock3/> {slotTime(booking?.slot_id)}</div></div><div className="button-row"><button className="secondary" onClick={()=>navigate('/dashboard')}>Dashboard</button><button className="primary" onClick={()=>navigate('/queue')}>Watch live queue <Wifi size={17}/></button></div></div>}

function Queue(){const booking=loadJson(BOOKING_KEY,null);const [queue,setQueue]=useState(null);const [connected,setConnected]=useState(false);const [error,setError]=useState('');const wsRef=useRef(null);const refresh=async()=>{if(!booking)return;try{setQueue(await api(`/queue/status/${booking.id}`));setError('')}catch(e){setError(e.message)}};
 useEffect(()=>{if(!booking)return;refresh();const token=localStorage.getItem(TOKEN_KEY);const ws=new WebSocket(`${WS_BASE}/ws/queue/${booking.id}?token=${encodeURIComponent(token)}`);wsRef.current=ws;ws.onopen=()=>setConnected(true);ws.onclose=()=>setConnected(false);ws.onerror=()=>setConnected(false);ws.onmessage=e=>{try{setQueue(JSON.parse(e.data))}catch{}};return()=>ws.close()},[booking?.id]);
 if(!booking)return <Empty title="No active queue" text="Book a procurement slot first to receive a token." action="Book a slot" href="/book-slot"/>;
 const current=queue?.current_token||0, mine=queue?.token_number||booking.token_number, ahead=queue?.people_ahead??Math.max(0,mine-current); const progress=Math.min(100,Math.max(0,100-(ahead*18)));
 return <Page title="Live queue" subtitle={`${centreName(booking.slot_id)} · ${slotTime(booking.slot_id)}`} badge={connected?'LIVE CONNECTION':'POLLING'}><div className="queue-grid"><TiltCard className="queue-hero"><div className="queue-ring" style={{'--progress':`${progress}%`}}><div><span>YOUR TOKEN</span><strong>#{mine}</strong></div></div><div className="queue-copy"><div className="live-pill"><span/> {connected?'LIVE':'SYNCING'}</div><span className="kicker">NOW SERVING</span><h2>#{current}</h2><p>Stay relaxed. We'll keep your queue state updated.</p></div></TiltCard><div className="queue-metrics"><Metric label="People ahead" value={ahead} icon={Users}/><Metric label="Estimated wait" value={`${queue?.estimated_wait_minutes??ahead*5} min`} icon={Clock3}/><Metric label="Booking" value={`#${booking.id}`} icon={Ticket}/></div></div><div className="queue-list glass"><div className="section-head"><div><span className="kicker">TOKEN FLOW</span><h2>Queue around you</h2></div><button className="ghost" onClick={refresh}><RefreshCw size={16}/> Refresh</button></div><div className="token-flow">{Array.from({length:Math.min(7,Math.max(4,mine-current+3))},(_,i)=>current+i).map(n=><div key={n} className={n===mine?'flow-token mine':n<=current?'flow-token done':'flow-token'}><span>#{n}</span>{n===current&&<small>Serving</small>}{n===mine&&<small>Your token</small>}</div>)}</div></div></Page>}
function Metric({label,value,icon:Icon}){return <TiltCard className="metric big-metric"><div className="metric-icon mint"><Icon/></div><div><span>{label}</span><strong>{value}</strong></div></TiltCard>}

function Crops(){const [listings,setListings]=useState(loadJson(LISTINGS_KEY,[]));const [crop,setCrop]=useState('Wheat');const [qty,setQty]=useState('500');const [loading,setLoading]=useState(false);const [error,setError]=useState('');const add=async()=>{setLoading(true);setError('');try{const listing=await api('/farmers/me/listings',{method:'POST',body:JSON.stringify({crop,quantity_kg:Number(qty)})});const next=[...listings,listing];setListings(next);saveJson(LISTINGS_KEY,next);window.__sfpmsToast?.(`${listing.crop} listing created`);setQty('500')}catch(e){setError(e.message)}finally{setLoading(false)}};return <Page title="My crops" subtitle="Register produce with the procurement system." badge="FARMER INVENTORY"><div className="crop-layout"><div className="glass form-card compact"><span className="kicker">ADD NEW LISTING</span><h3>What are you bringing?</h3><label>Crop<select value={crop} onChange={e=>setCrop(e.target.value)}><option>Wheat</option><option>Rice</option><option>Maize</option><option>Soybean</option></select></label><label>Quantity (kg)<input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></label>{error&&<div className="error-box">{error}</div>}<button className="primary big" onClick={add} disabled={loading}>{loading?<><RefreshCw className="spin"/> Saving…</>:<>Register crop <Sprout size={17}/></>}</button></div><div className="crop-list">{listings.length===0?<Empty title="No crops yet" text="Register your first crop to unlock slot booking."/>:listings.map(l=><TiltCard className="crop-card" key={l.id}><div className="crop-head"><div className="crop-icon"><Sprout/></div><span className={`status-dot ${l.status==='QUALITY_CHECKED'?'ok':''}`}>{prettyStatus(l.status)}</span></div><h3>{l.crop}</h3><div className="crop-data"><span>Listing <b>#{l.id}</b></span><span>Quantity <b>{l.quantity_kg} kg</b></span></div><div className="crop-footer"><Leaf size={15}/> Registered with SFPMS</div></TiltCard>)}</div></div></Page>}

function Quality(){const user=loadJson(USER_KEY,null);const [listingId,setListingId]=useState(loadJson(LISTINGS_KEY,[])[0]?.id||'');const [quality,setQuality]=useState(null);const [loading,setLoading]=useState(false);const [form,setForm]=useState({grade:'A',moisture_percent:'11.5',foreign_matter_percent:'0.8',accepted_quantity_kg:'480'});const load=async()=>{if(!listingId)return;setLoading(true);try{setQuality(await api(`/quality/${listingId}`))}catch(e){setQuality(null)}finally{setLoading(false)}};useEffect(()=>{if(user.role==='farmer')load()},[listingId]);const submit=async()=>{setLoading(true);try{const q=await api(`/quality/${listingId}/grade`,{method:'POST',body:JSON.stringify({...form,moisture_percent:Number(form.moisture_percent),foreign_matter_percent:Number(form.foreign_matter_percent),accepted_quantity_kg:Number(form.accepted_quantity_kg)})});setQuality(q);window.__sfpmsToast?.('Quality check recorded');}catch(e){window.__sfpmsToast?.(e.message)}finally{setLoading(false)}};const farmerListings=loadJson(LISTINGS_KEY,[]);
 return <Page title="Quality check" subtitle={user.role==='farmer'?'View the authorizer\'s grading result.':'Record quality at the procurement centre.'} badge="QUALITY ASSURANCE"><div className="quality-layout">{user.role==='field_agent'?<div className="glass form-card"><span className="kicker">FIELD AGENT</span><h3>Record crop quality</h3><label>Listing ID<input value={listingId} onChange={e=>setListingId(e.target.value)} placeholder="e.g. 1"/></label><div className="grade-pills">{['A','B','C'].map(g=><button type="button" className={form.grade===g?'selected':''} onClick={()=>setForm({...form,grade:g})} key={g}>Grade {g}</button>)}</div>{[['moisture_percent','Moisture %'],['foreign_matter_percent','Foreign matter %'],['accepted_quantity_kg','Accepted quantity (kg)']].map(([k,l])=><label key={k}>{l}<input type="number" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<button className="primary big" onClick={submit} disabled={!listingId||loading}>{loading?<><RefreshCw className="spin"/> Recording…</>:<>Save quality check <Check/></>}</button></div>:<div className="glass form-card"><span className="kicker">FARMER VIEW</span><h3>Authorizer result</h3><label>Your crop<select value={listingId} onChange={e=>setListingId(e.target.value)}>{farmerListings.length===0?<option value="">No registered crops</option>:farmerListings.map(l=><option value={l.id} key={l.id}>#{l.id} · {l.crop}</option>)}</select></label><button className="ghost full" onClick={load} disabled={!listingId}><RefreshCw size={16}/> Check latest result</button></div>}
 <div className="quality-result glass">{quality?<><div className="quality-badge"><span>GRADE</span><strong>{quality.grade}</strong></div><div className="quality-lines"><div><span>Moisture</span><b>{quality.moisture_percent}%</b></div><div><span>Foreign matter</span><b>{quality.foreign_matter_percent}%</b></div><div><span>Accepted quantity</span><b>{quality.accepted_quantity_kg} kg</b></div><div><span>Checked by</span><b>Field Agent #{quality.checked_by}</b></div></div><div className="verified"><ShieldCheck size={18}/> Quality result verified by SFPMS</div></>:<div className="empty-inner"><FileCheck2 size={34}/><h3>Quality pending</h3><p>The field agent has not recorded a result for this listing yet.</p></div>}</div></div></Page>}

function Operations({user}){const [listingId,setListingId]=useState('');const [slotId,setSlotId]=useState('1');const [message,setMessage]=useState('');const advance=async()=>{try{const r=await api(`/queue/advance/${slotId}`,{method:'POST'});setMessage(`Centre slot #${r.slot_id} advanced to token #${r.current_token}`)}catch(e){setMessage(e.message)}};const approve=async()=>{try{const r=await api(`/procurement/${listingId}/approve`,{method:'POST'});setMessage(`Listing #${r.listing_id}: ${r.status}`)}catch(e){setMessage(e.message)}};return <Page title="Operations console" subtitle="Centre-side controls for queue and procurement." badge="CONTROL ROOM"><div className="ops-grid"><TiltCard className="ops-card"><div className="ops-icon"><ListOrdered/></div><span className="kicker">QUEUE CONTROL</span><h3>Advance current token</h3><p>Use this when the next farmer is being served. Connected farmers receive the update through WebSocket.</p><select value={slotId} onChange={e=>setSlotId(e.target.value)}>{SLOTS.map(s=><option value={s.id} key={s.id}>{s.centre} · {s.time} · Slot #{s.id}</option>)}</select><button className="primary big" onClick={advance}>Serve next token <ArrowRight size={17}/></button></TiltCard><TiltCard className="ops-card"><div className="ops-icon blue"><ShieldCheck/></div><span className="kicker">PROCUREMENT OFFICER</span><h3>Approve procurement</h3><p>Approval is blocked by the backend until a quality check exists for the listing.</p><input value={listingId} onChange={e=>setListingId(e.target.value)} placeholder="Listing ID e.g. 1"/><button className="primary big" onClick={approve} disabled={!listingId}>Approve listing <Check/></button></TiltCard></div>{message&&<div className="info-banner"><CheckCircle2/><div><b>Backend response</b><span>{message}</span></div></div>}</Page>}

function Payments(){const booking=loadJson(BOOKING_KEY,null);return <Page title="Payments" subtitle="Payment status will be connected to the procurement/payment service." badge="FINANCE"><div className="glass coming"><div className="coming-icon"><WalletCards/></div><span className="kicker">READY FOR NEXT INTEGRATION</span><h2>Procurement approved ≠ payment settled</h2><p>The current backend exposes procurement status, but it does not yet expose a payment-history endpoint. This screen intentionally avoids fake payment data.</p>{booking&&<button className="ghost" onClick={async()=>{try{const p=await api(`/procurement/${booking.listing_id}`);window.__sfpmsToast?.(`Procurement status: ${p.status}`)}catch(e){window.__sfpmsToast?.(e.message)}}}>Check procurement status <ArrowRight size={16}/></button>}</div></Page>}
function History(){return <Page title="History" subtitle="Transaction history will populate when PostgreSQL-backed history endpoints are added." badge="RECORDS"><div className="glass coming"><div className="coming-icon"><History/></div><span className="kicker">DATABASE PHASE</span><h2>No fabricated history</h2><p>The current backend is intentionally in-memory and does not expose a history-list endpoint. Once PostgreSQL is connected, this page can show real transactions.</p></div></Page>}

function Page({title,subtitle,badge,children}){return <div className="page"><div className="page-heading"><div><span className="kicker">{badge}</span><h1>{title}</h1><p>{subtitle}</p></div></div>{children}</div>}
function Empty({title,text,action,href}){const navigate=useNavigate();return <div className="empty glass"><div className="empty-icon"><Sprout/></div><h3>{title}</h3><p>{text}</p>{action&&<button className="primary" onClick={()=>navigate(href)}>{action}<ArrowRight size={15}/></button>}</div>}
function pageTitle(p){return ({'/dashboard':'Overview','/book-slot':'Book a slot','/crops':'My crops','/queue':'Live queue','/quality':'Quality check','/payments':'Payments','/history':'History','/operations':'Operations'})[p]||'SFPMS'}
function centreName(id){return SLOTS.find(s=>s.id===Number(id))?.centre||'Procurement centre'}
function slotTime(id){return SLOTS.find(s=>s.id===Number(id))?.time||'Scheduled slot'}
function initials(name='User'){return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
function prettyRole(r){return r==='field_agent'?'Field Agent':r==='procurement_officer'?'Procurement Officer':r==='admin'?'System Admin':'Farmer'}
function prettyStatus(s=''){return s.replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}

function RouterView(){const location=useLocation();const user=loadJson(USER_KEY,null);if(!user)return <App/>;let page=<Dashboard user={user}/>;const p=location.pathname;if(p==='/book-slot')page=<BookSlot/>;else if(p==='/confirmation')page=<Confirmation/>;else if(p==='/queue')page=<Queue/>;else if(p==='/crops')page=<Crops/>;else if(p==='/quality')page=<Quality/>;else if(p==='/payments')page=<Payments/>;else if(p==='/history')page=<History/>;else if(p==='/operations')page=<Operations user={user}/>;return <Shell user={user} onLogout={logout}>{page}</Shell>}

createRoot(document.getElementById('root')).render(<BrowserRouter><RouterView/></BrowserRouter>);
