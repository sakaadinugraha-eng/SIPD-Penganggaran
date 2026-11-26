import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, UserPlus, Edit2, Trash2, Key, User, ShieldCheck, Check, X, AlertCircle } from 'lucide-react';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.status === 'success') {
        setUsers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedUser(null);
    setFormUsername('');
    setFormName('');
    setFormPassword('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setModalMode('edit');
    setSelectedUser(u);
    setFormUsername(u.username || u.name);
    setFormName(u.name);
    setFormPassword('');
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const url = modalMode === 'add' ? '/api/users' : `/api/users/${selectedUser.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const payload = {
        username: formUsername,
        name: formName,
      };
      if (modalMode === 'add' || formPassword) {
        payload.password = formPassword;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.status === 'success') {
        toast.success(json.message);
        closeModal();
        fetchUsers();
      } else {
        const errText = json.message || 'Terjadi kesalahan saat menyimpan data user.';
        setFormError(errText);
        toast.error(errText);
      }
    } catch (err) {
      setFormError('Gagal menghubungi server.');
      toast.error('Gagal menghubungi server.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Yakin ingin menghapus pengguna "${u.username || u.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      const json = await res.json();
      if (res.ok && json.status === 'success') {
        toast.success(json.message);
        fetchUsers();
      } else {
        toast.error(json.message || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server.');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Manajemen & Atur Pengguna</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola akun administrator dan username login untuk mengakses dashboard SADA SIPD.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table Container Full Width */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Daftar Pengguna ({users.length})
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-6">Username Login</th>
                <th className="py-3 px-6">Nama Lengkap</th>
                <th className="py-3 px-6">Waktu Dibuat</th>
                <th className="py-3 px-6 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Memuat daftar pengguna...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const isCurrent = currentUser && currentUser.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs">
                            {u.username || 'admin'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-800 font-medium">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Edit Data User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent || users.length <= 1}
                            className={`p-1.5 rounded-lg border transition ${
                              isCurrent || users.length <= 1
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={
                              isCurrent
                                ? 'Tidak bisa menghapus akun sendiri'
                                : users.length <= 1
                                ? 'Tidak bisa menghapus user terakhir'
                                : 'Hapus User'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Data Pengguna'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Login
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Contoh: admin"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: DEVELOPER / Administrator"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalMode === 'add' ? 'Password' : 'Password Baru (Kosongkan jika tidak ingin diubah)'}
                </label>
                <input
                  type="password"
                  required={modalMode === 'add'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{modalMode === 'add' ? 'Simpan Pengguna' : 'Perbarui Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
