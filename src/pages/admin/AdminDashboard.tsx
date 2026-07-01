import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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

const StatCard: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent }) => (
  <AdminCard className="p-5">
    <p className="font-sans text-[11px] tracking-widest uppercase text-comun-muted mb-2">{label}</p>
    <p className={`font-serif-display text-3xl font-semibold ${accent ? 'text-gold-gradient' : 'text-comun-white'}`}>{value}</p>
  </AdminCard>
);

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-dashboard').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-comun-muted">Could not load dashboard.</p>;

  const { stats, trend } = data;

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle="Overview of CoMUN 2026 registrations." />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Registrations" value={stats.total} accent />
        <StatCard label="Individual" value={stats.individual} />
        <StatCard label="Institutional" value={stats.institutional} />
        <StatCard label="Single Delegations" value={stats.single} />
        <StatCard label="Double Delegations" value={stats.double} />
        <StatCard
          label="Registration Status"
          value={<span className={stats.registrationOpen ? 'text-emerald-400' : 'text-comun-maroon-light'}>{stats.registrationOpen ? 'Open' : 'Closed'}</span>}
        />
      </div>

      <AdminCard className="p-5">
        <p className="font-sans text-sm text-comun-white/80 mb-4">Registration Trend <span className="text-comun-muted">(last 14 days)</span></p>
        <div style={{ width: '100%', height: 280 }}>
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
    </div>
  );
};

export default AdminDashboard;
