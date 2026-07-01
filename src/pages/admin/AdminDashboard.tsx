import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, Building2, TrendingUp, ToggleLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner } from '../../components/admin/AdminUI';

interface DashboardData {
  stats: {
    total: number;
    individual: number;
    institutional: number;
    single: number;
    double: number;
    registrationOpen: boolean;
  };
  trend: { date: string; count: number }[];
}

interface RecentReg {
  id: string;
  applicationId: string;
  type: 'INDIVIDUAL' | 'INSTITUTIONAL';
  delegationType: 'SINGLE' | 'DOUBLE' | null;
  primaryName: string | null;
  institutionName: string | null;
  committee: string | null;
  submittedAt: string;
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

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recent, setRecent] = useState<RecentReg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin-dashboard'),
      api.get('/admin-registrations'),
    ]).then(([dash, regs]) => {
      setData(dash.data);
      // Take 5 most recent
      setRecent((regs.data.registrations as RecentReg[]).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-comun-muted font-sans text-sm">Could not load dashboard.</p>;

  const { stats, trend } = data;

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle="Overview of CoMUN 2026 registrations." />

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Registrations" value={stats.total} accent icon={<TrendingUp className="w-4 h-4" />} />
        <StatCard label="Individual" value={stats.individual} icon={<Users className="w-4 h-4" />}
          sub={`${stats.single} single · ${stats.double} double`} />
        <StatCard label="Institutional" value={stats.institutional} icon={<Building2 className="w-4 h-4" />} />
        <StatCard
          label="Registration Status"
          value={
            <span className={stats.registrationOpen ? 'text-emerald-400' : 'text-comun-maroon-light'}>
              {stats.registrationOpen ? 'Open' : 'Closed'}
            </span>
          }
          icon={<ToggleLeft className="w-4 h-4" />}
          sub={stats.registrationOpen ? 'Accepting new entries' : 'Not accepting entries'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* ── Trend chart ─────────────────────────────────────────────── */}
        <AdminCard className="p-5 xl:col-span-2">
          <p className="font-sans text-sm text-comun-white/80 mb-4">
            Registration Trend <span className="text-comun-muted">(last 14 days)</span>
          </p>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD000" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FFD000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#8a8a8a', fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} stroke="rgba(255,255,255,0.1)" />
                <YAxis allowDecimals={false} tick={{ fill: '#8a8a8a', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip
                  contentStyle={{ background: '#0c1730', border: '1px solid rgba(255,208,0,0.2)', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: '#FFD000' }}
                  itemStyle={{ color: '#F5F0E8' }}
                />
                <Area type="monotone" dataKey="count" stroke="#FFD000" strokeWidth={2} fill="url(#goldFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <AdminCard className="p-5 flex flex-col gap-2">
          <p className="font-sans text-sm text-comun-white/80 mb-2">Quick Actions</p>
          {[
            { to: '/admin/registrations', label: 'View all registrations', sub: `${stats.total} total` },
            { to: '/admin/messages', label: 'Check messages', sub: 'Contact form inbox' },
            { to: '/admin/resources', label: 'Manage resources', sub: 'Files & categories' },
            { to: '/admin/settings', label: 'Toggle registration', sub: stats.registrationOpen ? 'Currently open' : 'Currently closed' },
            { to: '/admin/logs', label: 'Activity logs', sub: 'Admin audit trail' },
          ].map(({ to, label, sub }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-sm hover:bg-white/5 transition-colors group"
            >
              <div>
                <p className="font-sans text-sm text-comun-white/80 group-hover:text-comun-white transition-colors">{label}</p>
                <p className="font-sans text-xs text-comun-muted">{sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-comun-muted group-hover:text-comun-gold transition-colors flex-shrink-0" />
            </Link>
          ))}
        </AdminCard>
      </div>

      {/* ── Recent registrations ─────────────────────────────────────────── */}
      {recent.length > 0 && (
        <AdminCard>
          <div className="flex items-center justify-between px-5 py-4 border-b border-comun-gold/10">
            <p className="font-sans text-sm text-comun-white/80">Recent Registrations</p>
            <Link to="/admin/registrations" className="font-sans text-xs text-comun-gold/70 hover:text-comun-gold transition-colors inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-white/5 text-comun-muted text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3">Application ID</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Name / Institution</th>
                  <th className="px-5 py-3 hidden md:table-cell">Committee</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-comun-gold font-medium">{r.applicationId}</td>
                    <td className="px-5 py-3 text-comun-white/70 hidden sm:table-cell">{r.primaryName ?? r.institutionName ?? '—'}</td>
                    <td className="px-5 py-3 text-comun-white/60 hidden md:table-cell">{r.committee ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${r.type === 'INDIVIDUAL' ? 'bg-comun-gold/10 text-comun-gold/80' : 'bg-comun-maroon/20 text-comun-maroon-light'}`}>
                        {r.type === 'INDIVIDUAL' ? (r.delegationType === 'DOUBLE' ? 'Ind·Double' : 'Ind·Single') : 'Institutional'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-comun-muted hidden lg:table-cell">{r.submittedAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
};

export default AdminDashboard;
