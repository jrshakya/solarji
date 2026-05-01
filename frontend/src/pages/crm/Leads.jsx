import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Target } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['Lead', 'Calling', 'Visit', 'Filing', 'Loan Filing', 'Loan Process', 'Installation', 'Kesco Filing', 'Kesco Process', 'Meter Install', 'Commission'];

const stageColors = {
  'Lead': 'bg-gray-100 text-gray-700',
  'Calling': 'bg-blue-100 text-blue-700',
  'Visit': 'bg-purple-100 text-purple-700',
  'Filing': 'bg-yellow-100 text-yellow-700',
  'Loan Filing': 'bg-orange-100 text-orange-700',
  'Loan Process': 'bg-orange-200 text-orange-800',
  'Installation': 'bg-green-100 text-green-700',
  'Kesco Filing': 'bg-teal-100 text-teal-700',
  'Kesco Process': 'bg-cyan-100 text-cyan-700',
  'Meter Install': 'bg-indigo-100 text-indigo-700',
  'Commission': 'bg-emerald-100 text-emerald-800',
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const stage = searchParams.get('stage') || '';
    setStageFilter(stage);
    const params = new URLSearchParams();
    if (stage) params.set('stage', stage);
    api.get(`/leads?${params}`).then(res => setLeads(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [searchParams]);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.city || '').toLowerCase().includes(q);
    const matchStage = !stageFilter || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <Layout module="crm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {stageFilter ? `${stageFilter} Leads` : 'All Leads'}
          </h1>
          <button onClick={() => navigate('/crm/leads/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input md:w-52"
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
          >
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">{filtered.length} leads found</p>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Phone</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">City</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Stage</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Assigned To</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Created By</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr
                      key={lead._id}
                      onClick={() => navigate(`/crm/leads/${lead._id}`)}
                      className="border-b border-gray-50 hover:bg-solar-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-gray-800">{lead.name}</td>
                      <td className="py-3 px-3 text-gray-600">{lead.phone}</td>
                      <td className="py-3 px-3 text-gray-500">{lead.city || '—'}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${stageColors[lead.stage] || 'bg-gray-100 text-gray-600'}`}>{lead.stage}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{lead.assignedTo?.name || '—'}</td>
                      <td className="py-3 px-3 text-gray-500">{lead.createdBy?.name || '—'}</td>
                      <td className="py-3 px-3 text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
