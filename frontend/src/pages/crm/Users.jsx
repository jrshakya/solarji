import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';
import { hashPassword } from '../../api/crypto';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  const emptyForm = { name: '', email: '', password: '', role: 'user', phone: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    api.get('/users').then(res => setUsers(res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', isActive: u.isActive });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editing && !form.password) return toast.error('Password required for new user');
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.password) {
        payload.password = await hashPassword(payload.password);
      } else {
        delete payload.password;
      }
      if (editing) {
        await api.put(`/users/${editing._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', payload);
        toast.success('User created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      load();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <Layout module="crm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Phone</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-solar-100 rounded-full flex items-center justify-center text-solar-700 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{u.name}</span>
                          {u._id === currentUser?._id && <span className="badge bg-solar-100 text-solar-700">You</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{u.email}</td>
                      <td className="py-3 px-3 text-gray-500">{u.phone || '—'}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(u)} className="btn-secondary p-1.5">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u._id !== currentUser?._id && (
                            <button onClick={() => handleDelete(u._id, u.name)} className="btn-danger p-1.5">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">{editing ? 'Edit User' : 'Create New User'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name} onChange={e => f('name', e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" required value={form.email} onChange={e => f('email', e.target.value)} placeholder="john@solarji.com" />
                </div>
                <div>
                  <label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => f('password', e.target.value)}
                      placeholder="••••••••"
                      required={!editing}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Role</label>
                    <select className="input" value={form.role} onChange={e => f('role', e.target.value)}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+91 XXXXX" />
                  </div>
                </div>
                {editing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={e => f('isActive', e.target.checked)}
                      className="w-4 h-4 text-solar-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">Active User</label>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
