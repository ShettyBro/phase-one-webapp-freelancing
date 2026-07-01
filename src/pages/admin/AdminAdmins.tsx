import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, KeyRound, Loader2, Copy, Check, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner, EmptyState } from '../../components/admin/AdminUI';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

const PasswordReveal: React.FC<{ password: string; onClose: () => void }> = ({ password, onClose }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 p-4 border border-comun-gold/30 bg-comun-gold/5 rounded-sm">
      <p className="font-sans text-xs text-comun-muted mb-2">Share this password securely — it won't be shown again.</p>
      <div className="flex items-center gap-3">
        <code className="font-mono text-lg text-comun-gold tracking-wider">{password}</code>
        <button onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-1.5 text-comun-gold hover:text-comun-gold-light">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={onClose} className="ml-auto font-sans text-xs text-comun-muted hover:text-comun-white">Dismiss</button>
      </div>
    </div>
  );
};

const AdminAdmins: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ label: string; password: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/superadmin-admins');
    setAdmins(data.admins);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) { setError('Name, email and phone are required.'); return; }
    setCreating(true);
    try {
      const { data } = await api.post('/superadmin-admins', { name: name.trim(), email: email.trim(), phone: phone.trim() });
      setRevealed({ label: `${data.admin.username} · password`, password: data.password });
      setName(''); setEmail(''); setPhone('');
      await load();
    } catch (e) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not create admin.');
    } finally { setCreating(false); }
  };

  const resetPassword = async (id: string, username: string) => {
    setBusyId(id);
    try {
      const { data } = await api.patch('/superadmin-admins', { resetPassword: true }, { params: { id } });
      setRevealed({ label: `${username} · new password`, password: data.password });
    } finally { setBusyId(null); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    setBusyId(id);
    try {
      await api.patch('/superadmin-admins', { isActive: !isActive }, { params: { id } });
      await load();
    } finally { setBusyId(null); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminPageHeader title="Admins" subtitle="Create and manage admin accounts." />

      <AdminCard className="p-5 mb-6">
        <p className="font-sans text-sm text-comun-white/80 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-comun-gold" /> Create Admin</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="form-input" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="form-input" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="form-input" />
        </div>
        <p className="font-sans text-xs text-comun-muted mt-2">Username &amp; password are generated automatically.</p>
        {error && <p className="form-error mt-2">{error}</p>}
        <button onClick={create} disabled={creating} className="btn-primary text-xs px-5 py-2.5 mt-3 inline-flex items-center gap-2">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create Admin
        </button>
        {revealed && <PasswordReveal password={revealed.password} onClose={() => setRevealed(null)} />}
      </AdminCard>

      <AdminCard>
        {admins.length === 0 ? (
          <EmptyState message="No admins yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-comun-gold/10 text-comun-muted text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Username</th><th className="px-4 py-3 hidden md:table-cell">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-comun-white/85">{a.name}</td>
                    <td className="px-4 py-3 text-comun-gold">{a.username}</td>
                    <td className="px-4 py-3 text-comun-muted hidden md:table-cell">{a.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 ${a.role === 'SUPER_ADMIN' ? 'text-comun-gold' : 'text-comun-white/70'}`}>
                        {a.role === 'SUPER_ADMIN' && <ShieldCheck className="w-3.5 h-3.5" />}{a.role === 'SUPER_ADMIN' ? 'Super' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={a.isActive ? 'text-emerald-400' : 'text-comun-maroon-light'}>{a.isActive ? 'Active' : 'Disabled'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.role !== 'SUPER_ADMIN' ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => resetPassword(a.id, a.username)} disabled={busyId === a.id} className="p-2 text-comun-muted hover:text-comun-gold" title="Reset password"><KeyRound className="w-4 h-4" /></button>
                          <button onClick={() => toggleActive(a.id, a.isActive)} disabled={busyId === a.id} className="px-2.5 py-1 rounded-full font-sans text-[11px] border border-comun-gold/20 text-comun-white/70 hover:text-comun-gold">
                            {a.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-comun-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
};

export default AdminAdmins;
