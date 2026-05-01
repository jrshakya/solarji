import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, Package } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

export default function VoucherForm({ type }) {
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState([]);
  const [party, setParty] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([{ item: '', itemName: '', quantity: 1, price: '', total: 0 }]);

  const isSell = type === 'SELL';
  const title = isSell ? 'Sales Voucher' : 'Purchase Voucher';
  const icon = isSell ? ShoppingCart : Package;

  useEffect(() => {
    api.get('/stock/items').then(r => setStockItems(r.data)).catch(() => {});
  }, []);

  const handleItemChange = (idx, itemId) => {
    const stockItem = stockItems.find(i => i._id === itemId);
    const newRows = [...rows];
    newRows[idx] = {
      ...newRows[idx],
      item: itemId,
      itemName: stockItem?.name || '',
      price: isSell ? (stockItem?.sellPrice || '') : (stockItem?.purchasePrice || ''),
    };
    newRows[idx].total = (newRows[idx].price || 0) * newRows[idx].quantity;
    setRows(newRows);
  };

  const handleRowChange = (idx, field, val) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    const qty = parseFloat(newRows[idx].quantity) || 0;
    const price = parseFloat(newRows[idx].price) || 0;
    newRows[idx].total = qty * price;
    setRows(newRows);
  };

  const addRow = () => setRows([...rows, { item: '', itemName: '', quantity: 1, price: '', total: 0 }]);
  const removeRow = (idx) => rows.length > 1 && setRows(rows.filter((_, i) => i !== idx));

  const totalAmount = rows.reduce((s, r) => s + (r.total || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.item && r.quantity > 0);
    if (validRows.length === 0) return toast.error('Add at least one item');
    setSaving(true);
    try {
      const payload = { type, items: validRows.map(r => ({ item: r.item, quantity: Number(r.quantity), price: Number(r.price) })), party, note };
      const res = await api.post('/stock/vouchers', payload);
      toast.success(`${title} ${res.data.voucherNumber} created!`);
      navigate('/stock/vouchers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout module="stock">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/stock')} className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-2">
            {isSell
              ? <ShoppingCart className="w-6 h-6 text-red-500" />
              : <Package className="w-6 h-6 text-green-600" />
            }
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create {title}</h1>
              <p className="text-gray-500 text-sm">{isSell ? 'Record a stock sale' : 'Record a stock purchase'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Party Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">{isSell ? 'Customer' : 'Supplier'} Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{isSell ? 'Customer Name' : 'Supplier Name'}</label>
                <input className="input" value={party} onChange={e => setParty(e.target.value)} placeholder={isSell ? 'Customer name' : 'Supplier / Party name'} />
              </div>
              <div>
                <label className="label">Note / Remarks</label>
                <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Items</h3>
              <button type="button" onClick={addRow} className="btn-secondary text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-2 px-2 font-semibold text-gray-600 w-8">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">Item</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600 w-28">Quantity</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600 w-36">
                      {isSell ? 'Sell Price (₹)' : 'Purchase Price (₹)'}
                    </th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600 w-32">Total (₹)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-2 px-2 text-gray-400">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <select
                          className="input"
                          value={row.item}
                          onChange={e => handleItemChange(idx, e.target.value)}
                          required
                        >
                          <option value="">Select item...</option>
                          {stockItems.map(i => (
                            <option key={i._id} value={i._id}>
                              {i.name} (Stock: {i.quantity} {i.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          className="input text-right"
                          min="1"
                          value={row.quantity}
                          onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          className="input text-right"
                          value={row.price}
                          onChange={e => handleRowChange(idx, 'price', e.target.value)}
                          placeholder="0"
                          required
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-gray-700">
                        ₹{(row.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2">
                        <button type="button" onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={4} className="py-3 px-2 text-right font-semibold text-gray-700">Total Amount:</td>
                    <td className="py-3 px-2 text-right font-bold text-lg text-solar-700">
                      ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/stock')} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" className={`flex-1 justify-center ${isSell ? 'btn-primary' : 'btn-success'}`} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save ${title}`}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
