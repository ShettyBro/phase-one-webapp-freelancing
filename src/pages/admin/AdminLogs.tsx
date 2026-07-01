import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminPageHeader, AdminCard, Spinner, EmptyState } from '../../components/admin/AdminUI';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogRow = any;

const AdminLogs: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  const [tab, setTab] = useState<'activity' | 'login'>('activity');
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/admin-logs', { params: { type: tab } });
    setLogs(data.logs);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Logs" subtitle="Administrative activity and access history." />

      {isSuperAdmin && (
        <div className="flex gap-2 mb-4">
          {(['activity', 'login'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-sm font-sans text-sm capitalize transition-colors ${tab === t ? 'bg-comun-gold/15 text-comun-gold' : 'text-comun-muted hover:text-comun-white'}`}
            >
              {t} logs
            </button>
          ))}
        </div>
      )}

      <AdminCard>
        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState message="No logs yet." />
        ) : tab === 'activity' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-comun-gold/10 text-comun-muted text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">Admin</th><th className="px-4 py-3">Action</th><th className="px-4 py-3 hidden md:table-cell">Details</th><th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-comun-white/80">{l.admin?.username || '—'}</td>
                    <td className="px-4 py-2.5 text-comun-gold">{l.action}</td>
                    <td className="px-4 py-2.5 text-comun-muted hidden md:table-cell">{l.details || '—'}</td>
                    <td className="px-4 py-2.5 text-comun-muted">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-comun-gold/10 text-comun-muted text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">Admin</th><th className="px-4 py-3">Result</th><th className="px-4 py-3 hidden md:table-cell">Device</th><th className="px-4 py-3 hidden lg:table-cell">IP</th><th className="px-4 py-3">Login</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-comun-white/80">{l.admin?.username || l.usernameTried || '—'}</td>
                    <td className={`px-4 py-2.5 ${l.success ? 'text-emerald-400' : 'text-comun-maroon-light'}`}>{l.success ? 'Success' : 'Failed'}</td>
                    <td className="px-4 py-2.5 text-comun-muted hidden md:table-cell">{[l.browser, l.device].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="px-4 py-2.5 text-comun-muted hidden lg:table-cell">{l.ipAddress || '—'}</td>
                    <td className="px-4 py-2.5 text-comun-muted">{new Date(l.loginTime).toLocaleString()}</td>
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

export default AdminLogs;
