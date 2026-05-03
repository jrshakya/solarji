import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, MessageSquare, GitBranch, User, Phone, Mail, MapPin, RefreshCw, Star, Clock, Calendar } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['Lead', 'Calling', 'Visit', 'Filing', 'Loan Filing', 'Loan Process', 'Installation', 'Kesco Filing', 'Kesco Process', 'Meter Install', 'Commission'];

const stageColors = {
  'Lead': 'bg-gray-100 text-gray-700 border-gray-300',
  'Calling': 'bg-blue-100 text-blue-700 border-blue-300',
  'Visit': 'bg-purple-100 text-purple-700 border-purple-300',
  'Filing': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Loan Filing': 'bg-orange-100 text-orange-700 border-orange-300',
  'Loan Process': 'bg-orange-200 text-orange-800 border-orange-400',
  'Installation': 'bg-green-100 text-green-700 border-green-300',
  'Kesco Filing': 'bg-teal-100 text-teal-700 border-teal-300',
  'Kesco Process': 'bg-cyan-100 text-cyan-700 border-cyan-300',
  'Meter Install': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  'Commission': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const ORANGE = '#f7941d';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function stageDuration(history, idx) {
  const entry = history[idx];
  const next  = history[idx + 1];
  const start = new Date(entry.date);
  const end   = next ? new Date(next.date) : new Date();
  const days  = Math.floor((end - start) / 86400000);
  return days;
}

function pointsColor(p) {
  if (p >= 4)  return '#10b981';
  if (p >= 2)  return ORANGE;
  if (p >= 0)  return '#f59e0b';
  return '#f43f5e';
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [lead, setLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveStage, setMoveStage] = useState('');
  const [moveUser, setMoveUser] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/leads/${id}`),
      api.get('/users'),
    ]).then(([leadRes, usersRes]) => {
      setLead(leadRes.data);
      setUsers(usersRes.data);
      setMoveStage(leadRes.data.stage);
      setMoveUser(leadRes.data.assignedTo?._id || '');
    }).catch(() => toast.error('Failed to load lead'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/leads/${id}/notes`, { text: note });
      const res = await api.get(`/leads/${id}`);
      setLead(res.data);
      setNote('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleMove = async () => {
    if (!moveStage) return;
    setMoving(true);
    try {
      const res = await api.put(`/leads/${id}/stage`, { stage: moveStage, assignedTo: moveUser || undefined, note: moveNote });
      setLead(res.data);
      setShowMoveModal(false);
      setMoveNote('');
      toast.success(`Lead moved to ${moveStage}`);
    } catch {
      toast.error('Failed to move lead');
    } finally {
      setMoving(false);
    }
  };

  if (loading) return (
    <Layout module="crm">
      <div className="flex items-center justify-center h-64 text-gray-400">Loading lead...</div>
    </Layout>
  );

  if (!lead) return (
    <Layout module="crm">
      <div className="p-4 sm:p-6 text-center text-gray-500">Lead not found</div>
    </Layout>
  );

  return (
    <Layout module="crm">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/crm/leads')} className="btn-secondary p-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
              <p className="text-gray-500 text-sm">{lead.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge border ${stageColors[lead.stage] || 'bg-gray-100'} px-3 py-1.5 text-sm`}>
              {lead.stage}
            </span>
            {(() => {
              const last = lead.stageHistory?.[lead.stageHistory.length - 1];
              const days = daysSince(last?.date || lead.createdAt);
              const pts  = 5 - days;
              return (
                <span style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:99, background: pts >= 0 ? 'rgba(16,185,129,.1)' : 'rgba(244,63,94,.1)', border:`1px solid ${pts>=0?'rgba(16,185,129,.3)':'rgba(244,63,94,.3)'}`, fontSize:'.78rem', fontWeight:700, color: pointsColor(pts) }}>
                  <Clock size={11}/> {days}d in stage · {pts >= 0 ? `+${pts}` : pts} pts if moved now
                </span>
              );
            })()}
            <button onClick={() => setShowMoveModal(true)} className="btn-primary gap-2">
              <RefreshCw className="w-4 h-4" /> Move Stage
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Details */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-solar-500" /> Customer Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { icon: User, label: 'Name', value: lead.name },
                  { icon: Phone, label: 'Phone', value: lead.phone },
                  { icon: Mail, label: 'Email', value: lead.email || '—' },
                  { icon: MapPin, label: 'City', value: lead.city || '—' },
                  { icon: MapPin, label: 'Address', value: lead.address || '—' },
                  { icon: User, label: 'System Size', value: lead.systemSize || '—' },
                  { icon: User, label: 'Source', value: lead.source || 'Manual' },
                  { icon: User, label: 'Created By', value: lead.createdBy?.name || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-gray-700 font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {lead.requirements && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Requirements</p>
                  <p className="text-sm text-gray-700">{lead.requirements}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-solar-500" /> Notes ({lead.notes?.length || 0})
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="input flex-1"
                  placeholder="Add a note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button className="btn-primary" onClick={handleAddNote} disabled={addingNote}>Add</button>
              </div>
              <div className="space-y-3">
                {lead.notes?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No notes yet</p>}
                {[...( lead.notes || [])].reverse().map((n, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.addedBy?.name} · {new Date(n.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Stage History */}
          <div className="space-y-5">
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-solar-500" /> Stage History
              </h3>
              <div className="space-y-3">
                {(lead.stageHistory || []).map((h, i, arr) => {
                  const dur = stageDuration(arr, i);
                  const isCurrent = i === arr.length - 1;
                  const pts = 5 - dur;
                  return (
                    <div key={i} className="relative pl-4 border-l-2" style={{ borderColor: isCurrent ? ORANGE : '#e5e7eb' }}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className={`badge ${stageColors[h.stage] || 'bg-gray-100 text-gray-600'}`}>{h.stage}</div>
                        {isCurrent && <span style={{ fontSize:'.68rem', fontWeight:700, color:ORANGE, background:'rgba(247,148,29,.1)', padding:'1px 7px', borderRadius:99 }}>CURRENT</span>}
                        {!isCurrent && (
                          <span style={{ fontSize:'.68rem', fontWeight:700, color: pts > 0 ? '#10b981' : pts === 0 ? '#f59e0b' : '#f43f5e', background: pts > 0 ? 'rgba(16,185,129,.08)' : pts === 0 ? 'rgba(245,158,11,.08)' : 'rgba(244,63,94,.08)', padding:'1px 7px', borderRadius:99 }}>
                            {pts > 0 ? `+${pts} pts` : pts === 0 ? '0 pts' : `${pts} pts`} · {dur}d
                          </span>
                        )}
                      </div>
                      {h.assignedTo && <p className="text-xs text-gray-600">→ {h.assignedTo.name}</p>}
                      {h.movedBy?.name && <p className="text-xs text-gray-500">by {h.movedBy.name}</p>}
                      {h.note && <p className="text-xs text-gray-500 italic">"{h.note}"</p>}
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={9}/>
                        {new Date(h.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                        {' · '}
                        {new Date(h.date).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  );
                }).reverse()}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">Assigned To</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-solar-100 rounded-full flex items-center justify-center text-solar-700 font-bold">
                  {lead.assignedTo?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{lead.assignedTo?.name || 'Unassigned'}</p>
                  <p className="text-xs text-gray-400">{lead.assignedTo?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Move Stage Modal */}
        {showMoveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-solar-500" /> Move Lead Stage
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Select Stage</label>
                  <select className="input" value={moveStage} onChange={e => setMoveStage(e.target.value)}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assign To</label>
                  <select className="input" value={moveUser} onChange={e => setMoveUser(e.target.value)}>
                    <option value="">Keep current ({lead.assignedTo?.name || 'None'})</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Note (optional)</label>
                  <input className="input" value={moveNote} onChange={e => setMoveNote(e.target.value)} placeholder="Reason for moving..." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1 justify-center" onClick={() => setShowMoveModal(false)}>Cancel</button>
                <button className="btn-primary flex-1 justify-center" onClick={handleMove} disabled={moving}>
                  {moving ? 'Moving...' : 'Confirm Move'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
