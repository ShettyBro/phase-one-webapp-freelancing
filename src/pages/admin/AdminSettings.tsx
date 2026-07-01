import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner } from '../../components/admin/AdminUI';

const AdminSettings: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => setOpen(data.registrationOpen)).finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setSaving(true);
    const next = !open;
    try {
      await api.put('/settings', { registrationOpen: next });
      setOpen(next);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminPageHeader title="Settings" subtitle="Conference registration controls." />
      <AdminCard className="p-6 max-w-lg">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="font-sans text-sm text-comun-white font-semibold mb-1">Registration</p>
            <p className="font-sans text-xs text-comun-muted">
              When off, every Register button on the site shows “Registrations Closed”.
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            role="switch"
            aria-checked={open}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${open ? 'bg-emerald-500/80' : 'bg-comun-maroon/70'} disabled:opacity-60`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${open ? 'translate-x-7' : ''}`} />
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 text-comun-gold animate-spin" />}
          <span className={`font-sans text-sm ${open ? 'text-emerald-400' : 'text-comun-maroon-light'}`}>
            Registrations are currently {open ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminSettings;
