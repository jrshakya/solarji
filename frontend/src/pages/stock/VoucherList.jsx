import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Eye, ShoppingCart, Package } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function VoucherList() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = typeFilter ? `?type=${typeFilter}` : '';
    api.get(`/stock/vouchers${params}`).then(r => setVouchers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [typeFilter]);

  const totals = {
    purchase: vouchers.filter(v => v.type === 'ADD').reduce((s, v) => s + v.totalAmount, 0),
    sales: vouchers.filter(v => v.type === 'SELL').reduce((s, v) => s + v.totalAmount, 0),
  };

  return (
    <Layout module="stock">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Voucher History</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/stock/voucher/add')} className="btn-success gap-2">
              <Package className="w-4 h-4" /> Purchase
            </button>
            <button onClick={() => navigate('/stock/voucher/sell')} className="btn-primary gap-2">
              <ShoppingCart className="w-4 h-4" /> Sell
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Total Purchases</p>
            <p className="text-2xl font-bold text-green-600">₹{totals.purchase.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="card border-l-4 border-solar-500">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-solar-600">₹{totals.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="card mb-4 flex gap-3">
          {['', 'ADD', 'SELL'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-secondary'} text-xs`}
            >
              {t === '' ? 'All' : t === 'ADD' ? 'Purchases' : 'Sales'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          {loading ? <div className="text-center py-12 text-gray-400">Loading vouchers...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Voucher No.</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Party</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Items</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">By</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Date</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-mono text-sm font-medium text-gray-800">{v.voucherNumber}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${v.type === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {v.type === 'ADD' ? 'Purchase' : 'Sale'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{v.party || '—'}</td>
                      <td className="py-3 px-3 text-gray-500">{v.items.length} item(s)</td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-700">₹{v.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-gray-500">{v.createdBy?.name}</td>
                      <td className="py-3 px-3 text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <button onClick={() => setSelected(v)} className="btn-secondary p-1.5">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No vouchers found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selected.voucherNumber}</h3>
                  <span className={`badge ${selected.type === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} mt-1`}>
                    {selected.type === 'ADD' ? 'Purchase Voucher' : 'Sales Voucher'}
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><p className="text-gray-400">Party</p><p className="font-medium">{selected.party || '—'}</p></div>
                <div><p className="text-gray-400">Date</p><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-gray-400">Created By</p><p className="font-medium">{selected.createdBy?.name}</p></div>
                {selected.note && <div><p className="text-gray-400">Note</p><p className="font-medium">{selected.note}</p></div>}
              </div>
              <table className="w-full text-sm border-t border-gray-100 pt-3">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-semibold text-gray-600">Item</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Qty</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Price</th>
                    <th className="text-right py-2 font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2">{item.itemName}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="py-2 text-right font-medium">₹{item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="py-3 text-right font-bold">Total:</td>
                    <td className="py-3 text-right font-bold text-solar-600">₹{selected.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
              <button onClick={() => setSelected(null)} className="btn-secondary w-full justify-center mt-4">Close</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
