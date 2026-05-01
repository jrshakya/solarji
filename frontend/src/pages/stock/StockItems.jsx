import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function StockItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();

  const emptyForm = { name: '', description: '', category: 'Solar Panel', unit: 'piece', purchasePrice: '', sellPrice: '', quantity: '', minQuantity: 0 };
  const [form, setForm] = useState(emptyForm);

  const load = () => { api.get('/stock/items').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description || '', category: item.category, unit: item.unit, purchasePrice: item.purchasePrice, sellPrice: item.sellPrice, quantity: item.quantity, minQuantity: item.minQuantity });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Item name required');
    setSaving(true);
    try {
      if (editing) { await api.put(`/stock/items/${editing._id}`, form); toast.success('Item updated'); }
      else { await api.post('/stock/items', form); toast.success('Item added'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await api.delete(`/stock/items/${id}`); toast.success('Item deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout module="stock">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stock Items</h1>
          {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Add Item</button>}
        </div>

        <div className="card mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card">
          {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Item Name', 'Category', 'Purchase Price', 'Sell Price', 'Quantity', 'Min Qty', ...(isAdmin ? ['Actions'] : [])].map(h => (
                      <th key={h} className="text-left py-3 px-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-solar-400" />
                          <div>
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3"><span className="badge bg-gray-100 text-gray-600">{item.category}</span></td>
                      <td className="py-3 px-3 text-gray-700">₹{item.purchasePrice?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-gray-700 font-medium">₹{item.sellPrice?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${item.quantity <= item.minQuantity && item.minQuantity > 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500">{item.minQuantity}</td>
                      {isAdmin && (
                        <td className="py-3 px-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(item)} className="btn-secondary p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(item._id, item.name)} className="btn-danger p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">No items found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Item' : 'Add Stock Item'}</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Item Name *</label>
                    <input className="input" required value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Solar Panel 400W" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={form.category} onChange={e => f('category', e.target.value)}>
                      {['Solar Panel', 'Inverter', 'Battery', 'Wire', 'Structure', 'ACDB/DCDB', 'Accessories', 'General'].map(c =>
                        <option key={c} value={c}>{c}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select className="input" value={form.unit} onChange={e => f('unit', e.target.value)}>
                      {['piece', 'meter', 'kg', 'set', 'pair', 'roll', 'box'].map(u =>
                        <option key={u} value={u}>{u}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="label">Purchase Price (₹)</label>
                    <input className="input" type="number" value={form.purchasePrice} onChange={e => f('purchasePrice', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Sell Price (₹)</label>
                    <input className="input" type="number" value={form.sellPrice} onChange={e => f('sellPrice', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Opening Quantity</label>
                    <input className="input" type="number" value={form.quantity} onChange={e => f('quantity', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Min Quantity Alert</label>
                    <input className="input" type="number" value={form.minQuantity} onChange={e => f('minQuantity', e.target.value)} placeholder="0" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Description</label>
                    <input className="input" value={form.description} onChange={e => f('description', e.target.value)} placeholder="Optional description" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Item'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
