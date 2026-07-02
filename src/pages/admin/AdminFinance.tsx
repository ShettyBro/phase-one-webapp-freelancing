import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, TrendingUp, Clock, Hash, FileSpreadsheet, Loader2, Search, CreditCard, Landmark,
} from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner, EmptyState } from '../../components/admin/AdminUI';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Cross-browser blob download (mirrors AdminRegistrations).
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type PaymentMethod = 'ONLINE' | 'OFFLINE' | null;

interface Payment {
  id: string;
  applicationId: string;
  type: 'INDIVIDUAL' | 'INSTITUTIONAL';
  delegationType: 'SINGLE' | 'DOUBLE' | null;
  committee: string | null;
  payer: string;
  amountPayable: number;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  submittedAt: string;
}

interface Summary {
  totalExpected: number;
  collectedOnline: { count: number; amount: number };
  pendingOffline: { count: number; amount: number };
  atDesk: { count: number; amount: number };
  referencesCaptured: number;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode; accent?: boolean; sub?: string }> = ({ label, value, icon, accent, sub }) => (
  <AdminCard className="p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="font-sans text-[11px] tracking-widest uppercase text-comun-muted">{label}</p>
      {icon && <span className="text-comun-gold/40">{icon}</span>}
    </div>
    <p className={`font-serif-display text-3xl font-semibold ${accent ? 'text-gold-gradient' : 'text-comun-white'}`}>{value}</p>
    {sub && <p className="font-sans text-xs text-comun-muted mt-1">{sub}</p>}
  </AdminCard>
);

const ModeBadge: React.FC<{ method: PaymentMethod }> = ({ method }) => {
  if (method === 'ONLINE')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400">
        <CreditCard className="w-3 h-3" /> Online
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-comun-gold/10 text-comun-gold/80">
      <Landmark className="w-3 h-3" /> At Desk
    </span>
  );
};

const AdminFinance: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [q, setQ] = useState('');
  const [modeFilter, setModeFilter] = useState<'' | 'ONLINE' | 'DESK'>('');
  const [exportBusy, setExportBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    api.get('/admin-finance')
      .then(({ data }) => {
        setSummary(data.summary);
        setPayments(data.payments as Payment[]);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return payments.filter((p) => {
      if (modeFilter === 'ONLINE' && p.paymentMethod !== 'ONLINE') return false;
      if (modeFilter === 'DESK' && p.paymentMethod === 'ONLINE') return false;
      if (!term) return true;
      return (
        p.applicationId.toLowerCase().includes(term) ||
        p.payer.toLowerCase().includes(term) ||
        (p.paymentReference ?? '').toLowerCase().includes(term)
      );
    });
  }, [payments, q, modeFilter]);

  const doExport = async () => {
    setExportBusy(true);
    try {
      const res = await fetch(`${API_BASE}/admin-export?type=payments`, { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      triggerDownload(await res.blob(), 'Payments_Finance_Report.xlsx');
    } catch {
      alert('Export failed — please try again.');
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Finance"
        subtitle="Payment records & revenue collected."
        actions={
          <button
            onClick={doExport}
            disabled={exportBusy || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-sans text-xs font-semibold border border-comun-gold/25 text-comun-gold/80 hover:bg-comun-gold/10 hover:text-comun-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exportBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Payments XLSX
          </button>
        }
      />

      {loading ? (
        <Spinner />
      ) : loadError || !summary ? (
        <AdminCard className="p-8 text-center">
          <p className="font-sans text-sm text-comun-maroon-light mb-4">Could not load finance data. Please try again.</p>
          <button onClick={load} className="btn-secondary text-sm px-6 py-2.5">Retry</button>
        </AdminCard>
      ) : (
        <>
          {/* ── Summary cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Expected"
              value={inr(summary.totalExpected)}
              accent
              icon={<Wallet className="w-4 h-4" />}
              sub={`${payments.length} registration${payments.length !== 1 ? 's' : ''}`}
            />
            <StatCard
              label="Collected · Online"
              value={<span className="text-emerald-400">{inr(summary.collectedOnline.amount)}</span>}
              icon={<TrendingUp className="w-4 h-4" />}
              sub={`${summary.collectedOnline.count} online payment${summary.collectedOnline.count !== 1 ? 's' : ''}`}
            />
            <StatCard
              label="Pending · At Desk"
              value={inr(summary.pendingOffline.amount + summary.atDesk.amount)}
              icon={<Clock className="w-4 h-4" />}
              sub={`${summary.pendingOffline.count + summary.atDesk.count} to settle at desk`}
            />
            <StatCard
              label="References Captured"
              value={summary.referencesCaptured}
              icon={<Hash className="w-4 h-4" />}
              sub="Online transaction IDs on file"
            />
          </div>

          {/* ── Filters ───────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-comun-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by App ID, payer, or reference no…"
                className="form-input pl-9"
              />
            </div>
            <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as '' | 'ONLINE' | 'DESK')} className="form-input sm:w-52">
              <option value="">All Payment Modes</option>
              <option value="ONLINE">Online (Bank Transfer)</option>
              <option value="DESK">Pay at Desk</option>
            </select>
          </div>

          {/* ── Payment records table ─────────────────────────────────────── */}
          <AdminCard>
            {filtered.length === 0 ? (
              <EmptyState message="No payment records found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-comun-gold/10 text-comun-muted font-sans text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-3">App ID</th>
                      <th className="px-4 py-3 hidden md:table-cell">Payer</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Type</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Reference No.</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] font-sans text-sm">
                        <td className="px-4 py-3 text-comun-gold font-medium">{p.applicationId}</td>
                        <td className="px-4 py-3 text-comun-white/70 hidden md:table-cell">{p.payer}</td>
                        <td className="px-4 py-3 text-comun-white/60 hidden lg:table-cell">
                          {p.type === 'INDIVIDUAL' ? `Ind · ${p.delegationType === 'DOUBLE' ? 'Double' : 'Single'}` : 'Institutional'}
                        </td>
                        <td className="px-4 py-3"><ModeBadge method={p.paymentMethod} /></td>
                        <td className="px-4 py-3 text-comun-white/80 font-mono text-xs break-all">
                          {p.paymentReference || <span className="text-comun-muted font-sans">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-comun-white/85 tabular-nums">
                          {p.amountPayable > 0 ? inr(p.amountPayable) : <span className="text-comun-muted">—</span>}
                        </td>
                        <td className="px-4 py-3 text-comun-muted hidden lg:table-cell">{p.submittedAt.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 py-2.5 border-t border-white/5 font-sans text-xs text-comun-muted">
              Showing {filtered.length} of {payments.length} record{payments.length !== 1 ? 's' : ''}
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
};

export default AdminFinance;
