import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminPageHeader, AdminCard, Spinner, EmptyState } from '../../components/admin/AdminUI';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogRow = any;
const PAGE_SIZE = 50;

const AdminLogs: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  const [tab, setTab] = useState<'activity' | 'login'>('activity');
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const { data } = await api.get('/admin-logs', { params: { type: tab } });
    setLogs(data.logs);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pageRows = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const Pagination = () => totalPages <= 1 ? null : (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 font-sans text-sm">
      <span className="text-comun-muted text-xs">Page {page} of {totalPages} · {logs.length} entries</span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 text-comun-muted hover:text-comun-gold disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pg = page <= 3 ? i + 1 : page + i - 2;
          if (pg < 1 || pg > totalPages) return null;
          return (
            <button key={pg} onClick={() => setPage(pg)}
              className={`w-7 h-7 rounded-sm text-xs ${pg === page ? 'bg-comun-gold/20 text-comun-gold' : 'text-comun-muted hover:text-comun-white'}`}>
              {pg}
            </button>
          );
        })}
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 text-comun-muted hover:text-comun-gold disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        title="Logs"
        subtitle="Administrative activity and access history."
        actions={
          <button onClick={load} className="p-2 text-comun-muted hover:text-comun-gold transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {isSuperAdmin && (
        <div className="flex gap-2 mb-4">
          {(['activity', 'login'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-sm font-sans text-sm capitalize transition-colors ${tab === t ? 'bg-comun-gold/15 text-comun-gold' : 'text-comun-muted hover:text-comun-white'}`}>
              {t} logs
            </button>
          ))}
        </div>
      )}

      <AdminCard>
        {loading ? <Spinner /> : logs.length === 0 ? <EmptyState message="No logs yet." /> : tab === 'activity' ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-comun-gold/10 text-comun-muted text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3 hidden md:table-cell">Details</th>
                    <th className="px-4 py-3 hidden sm:table-cell">IP</th>
                    <th className="px-4 py-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-comun-white/80">{l.admin?.username || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-medium ${l.action === 'LOGOUT' || l.action === 'REGISTRATION_DELETE' || l.action === 'RESOURCE_DELETE' || l.action === 'MESSAGE_DELETE'
                          ? 'text-comun-maroon-light' : l.action === 'LOGIN' || l.action === 'ADMIN_CREATION' ? 'text-emerald-400' : 'text-comun-gold'}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-comun-muted hidden md:table-cell">{l.details || '—'}</td>
                      <td className="px-4 py-2.5 text-comun-muted hidden sm:table-cell text-xs">{l.ipAddress || '—'}</td>
                      <td className="px-4 py-2.5 text-comun-muted">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-comun-gold/10 text-comun-muted text-[11px] uppercase tracking-wider">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3 hidden md:table-cell">Device</th>
                    <th className="px-4 py-3 hidden lg:table-cell">IP</th>
                    <th className="px-4 py-3">Login Time</th>
                    <th className="px-4 py-3 hidden xl:table-cell">Logout Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-comun-white/80">{l.admin?.username || l.usernameTried || '—'}</td>
                      <td className={`px-4 py-2.5 font-medium ${l.success ? 'text-emerald-400' : 'text-comun-maroon-light'}`}>
                        {l.success ? '✓ Success' : '✗ Failed'}
                      </td>
                      <td className="px-4 py-2.5 text-comun-muted hidden md:table-cell">{[l.browser, l.device].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-2.5 text-comun-muted hidden lg:table-cell text-xs">{l.ipAddress || '—'}</td>
                      <td className="px-4 py-2.5 text-comun-muted">{new Date(l.loginTime).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-comun-muted hidden xl:table-cell">
                        {l.logoutTime ? new Date(l.logoutTime).toLocaleString() : <span className="text-emerald-400/60 text-xs">Active</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </>
        )}
      </AdminCard>
    </div>
  );
};

export default AdminLogs;
