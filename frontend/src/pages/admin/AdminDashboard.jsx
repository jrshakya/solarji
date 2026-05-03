import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Target, Package, FileText, Plus, Trash2, Edit2, X, Sun, ArrowRight, Layers } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const ORANGE = '#f7941d';

const OVERVIEW = [
  { key:'users',    label:'Users',       icon:Users,    color:'#6366f1', path:'/crm/users'     },
  { key:'leads',    label:'Leads',       icon:Target,   color:ORANGE,    path:'/crm/leads'     },
  { key:'items',    label:'Stock Items', icon:Package,  color:'#10b981', path:'/stock/items'   },
  { key:'vouchers', label:'Vouchers',    icon:FileText, color:'#f43f5e', path:'/stock/vouchers'},
];

const QUICK = [
  { label:'Manage Users',        desc:'Create & manage CRM team',  icon:Users,   color:'#6366f1', path:'/crm/users'  },
  { label:'Stock Inventory',     desc:'Add & edit stock items',    icon:Layers,  color:'#10b981', path:'/stock/items'},
  { label:'Quotation Generator', desc:'Generate solar estimates',  icon:Sun,     color:ORANGE,    path:'/quotation'  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ users:0, leads:0, items:0, vouchers:0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', description:'', footer:'', rows:[] });
  const emptyRow = { label:'', type:'input', formula:'', unit:'', defaultValue:0 };

  useEffect(() => {
    api.get('/quotations/templates').then(r=>setTemplates(r.data)).catch(()=>{});
    Promise.all([api.get('/users'),api.get('/leads'),api.get('/stock/items'),api.get('/stock/vouchers')])
      .then(([u,l,i,v])=>setStats({users:u.data.length,leads:l.data.length,items:i.data.length,vouchers:v.data.length})).catch(()=>{});
  },[]);

  const openCreate = () => { setEditing(null); setForm({name:'',description:'',footer:'',rows:[{...emptyRow}]}); setShowModal(true); };
  const openEdit   = t  => { setEditing(t); setForm({name:t.name,description:t.description||'',footer:t.footer||'',rows:t.rows.map(r=>({...r}))}); setShowModal(true); };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name||form.rows.length===0) return toast.error('Name and rows required');
    setSaving(true);
    try {
      if (editing) { await api.put(`/quotations/templates/${editing._id}`,form); toast.success('Template updated'); }
      else { await api.post('/quotations/templates',form); toast.success('Template created'); }
      setShowModal(false);
      const r = await api.get('/quotations/templates'); setTemplates(r.data);
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };
  const handleDelete = async id => {
    if(!window.confirm('Delete this template?')) return;
    try { await api.delete(`/quotations/templates/${id}`); setTemplates(t=>t.filter(x=>x._id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };
  const addRow    = () => setForm(f=>({...f,rows:[...f.rows,{...emptyRow}]}));
  const removeRow = i  => setForm(f=>({...f,rows:f.rows.filter((_,idx)=>idx!==i)}));
  const updateRow = (i,field,val) => setForm(f=>{const rows=[...f.rows];rows[i]={...rows[i],[field]:val};return{...f,rows};});

  return (
    <Layout module="crm">
      <div style={{ padding:'clamp(1rem, 4vw, 2rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 5vw, 3rem)', maxWidth:1200 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'2rem' }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'rgba(247,148,29,.1)', border:`1.5px solid rgba(247,148,29,.25)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Settings size={18} style={{ color:ORANGE }}/>
          </div>
          <div>
            <h1 style={{ fontSize:'1.65rem', fontWeight:900, color:'#111111', letterSpacing:'-.03em', lineHeight:1 }}>Admin Panel</h1>
            <p style={{ fontSize:'.875rem', color:'#9ca3af' }}>System overview &amp; configuration</p>
          </div>
        </div>

        {/* Overview */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:'1rem', marginBottom:'1.75rem' }}>
          {OVERVIEW.map(({ key, label, icon:Icon, color, path }) => (
            <button key={key} onClick={()=>navigate(path)} className="card" style={{
              textAlign:'left', cursor:'pointer', border:`1.5px solid #f0f0f0`, transition:'all .15s',
              padding:'1.5rem', position:'relative', overflow:'hidden',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=ORANGE;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 12px 28px rgba(247,148,29,.12)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0f0f0';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='';}}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'1rem 1rem 0 0' }}/>
              <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
                <Icon size={18} style={{ color }}/>
              </div>
              <p style={{ fontSize:'2rem', fontWeight:900, color:'#111111', letterSpacing:'-.04em', lineHeight:1, marginBottom:4 }}>{stats[key]}</p>
              <p style={{ fontSize:'.78rem', fontWeight:600, color:'#6b7280' }}>{label}</p>
              <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:'.72rem', color:'#9ca3af', marginTop:6 }}>Manage <ArrowRight size={11}/></div>
            </button>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1rem', marginBottom:'1.75rem' }}>
          {QUICK.map(({ label, desc, icon:Icon, color, path }) => (
            <button key={label} onClick={()=>navigate(path)} className="card" style={{
              textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:14,
              border:`1.5px solid #f0f0f0`, borderLeft:`4px solid ${color}`, transition:'all .15s', padding:'1.25rem 1.5rem',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)';e.currentTarget.style.boxShadow='0 8px 22px rgba(0,0,0,.08)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.boxShadow='';}}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={18} style={{ color }}/>
              </div>
              <div>
                <p style={{ fontWeight:800, color:'#111111', fontSize:'.875rem' }}>{label}</p>
                <p style={{ fontSize:'.75rem', color:'#9ca3af', marginTop:2 }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Templates */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
            <div>
              <h2 style={{ fontWeight:800, color:'#111111', fontSize:'1rem' }}>Quotation Templates</h2>
              <p style={{ fontSize:'.78rem', color:'#9ca3af', marginTop:2 }}>Customise the solar quotation calculator</p>
            </div>
            <button onClick={openCreate} className="btn-primary" style={{ fontSize:'.8rem', padding:'.5rem 1rem' }}><Plus size={14}/> New Template</button>
          </div>
          {templates.length===0 ? (
            <div style={{ padding:'2.5rem 0', textAlign:'center' }}>
              <FileText size={40} style={{ color:'#e5e7eb', display:'block', margin:'0 auto 10px' }}/>
              <p style={{ color:'#9ca3af', fontSize:'.875rem' }}>No templates yet. Create one to customise the quotation calculator.</p>
            </div>
          ) : templates.map(t=>(
            <div key={t._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderRadius:14, border:'1.5px solid #f0f0f0', marginBottom:8, transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(247,148,29,.4)';e.currentTarget.style.background='#fff8f0';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0f0f0';e.currentTarget.style.background='transparent';}}
            >
              <div>
                <p style={{ fontWeight:800, color:'#111111', fontSize:'.875rem' }}>{t.name}</p>
                {t.description&&<p style={{ fontSize:'.78rem', color:'#9ca3af', marginTop:2 }}>{t.description}</p>}
                <p style={{ fontSize:'.72rem', color:'#d1d5db', marginTop:4 }}>{t.rows?.length} rows</p>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>openEdit(t)} className="btn-secondary" style={{ padding:'.4rem .7rem' }}><Edit2 size={13}/></button>
                <button onClick={()=>handleDelete(t._id)} className="btn-danger" style={{ padding:'.4rem .7rem' }}><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:740, maxHeight:'90vh', overflow:'auto', boxShadow:'0 40px 100px rgba(0,0,0,.2)' }}>
            <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
              <h3 style={{ fontWeight:900, color:'#111111', fontSize:'1.1rem' }}>{editing?'Edit':'Create'} Quotation Template</h3>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} style={{ padding:'1.5rem 2rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div><label className="label">Template Name *</label><input className="input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Residential Solar Quote"/></div>
                <div><label className="label">Description</label><input className="input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description"/></div>
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <label className="label" style={{ margin:0 }}>Calculation Rows</label>
                  <button type="button" onClick={addRow} className="btn-secondary" style={{ fontSize:'.78rem', padding:'.35rem .75rem' }}><Plus size={12}/> Add Row</button>
                </div>
                <div style={{ border:'1.5px solid #f0f0f0', borderRadius:12, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.82rem' }}>
                    <thead style={{ background:'#f9fafb' }}>
                      <tr>{['Label','Type','Formula / Default','Unit',''].map(h=><th key={h} style={{ textAlign:'left', padding:'10px 12px', fontWeight:700, color:'#6b7280', fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {form.rows.map((row,i)=>(
                        <tr key={i} style={{ borderTop:'1px solid #f3f4f6' }}>
                          <td style={{ padding:'6px 8px' }}><input className="input" style={{ fontSize:'.82rem' }} value={row.label} onChange={e=>updateRow(i,'label',e.target.value)} placeholder="Label" required/></td>
                          <td style={{ padding:'6px 8px', width:120 }}><select className="input" style={{ fontSize:'.82rem' }} value={row.type} onChange={e=>updateRow(i,'type',e.target.value)}><option value="input">Input</option><option value="calculated">Calculated</option><option value="fixed">Fixed</option></select></td>
                          <td style={{ padding:'6px 8px' }}>{row.type==='calculated'?<input className="input" style={{ fontSize:'.82rem', fontFamily:'monospace' }} value={row.formula} onChange={e=>updateRow(i,'formula',e.target.value)} placeholder="row[0] * row[1]"/>:<input className="input" style={{ fontSize:'.82rem' }} type="number" value={row.defaultValue} onChange={e=>updateRow(i,'defaultValue',e.target.value)}/>}</td>
                          <td style={{ padding:'6px 8px', width:80 }}><input className="input" style={{ fontSize:'.82rem' }} value={row.unit} onChange={e=>updateRow(i,'unit',e.target.value)} placeholder="kW, ₹"/></td>
                          <td style={{ padding:'6px 8px', width:40 }}><button type="button" onClick={()=>removeRow(i)} style={{ color:'#f43f5e', background:'none', border:'none', cursor:'pointer', padding:4 }}><X size={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize:'.72rem', color:'#9ca3af', marginTop:8 }}>Use <code style={{ background:'#f3f4f6', padding:'1px 5px', borderRadius:4 }}>row[n]</code> (0-based) in formulas.</p>
              </div>
              <div><label className="label">Footer / Terms</label><textarea className="input" rows={3} value={form.footer} onChange={e=>setForm(f=>({...f,footer:e.target.value}))} placeholder="Terms, validity, disclaimers…"/></div>
              <div style={{ display:'flex', gap:10, paddingTop:4 }}>
                <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex:1, justifyContent:'center' }} disabled={saving}>{saving?'Saving…':editing?'Update Template':'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
