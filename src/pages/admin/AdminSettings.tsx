import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner } from '../../components/admin/AdminUI';

const AdminSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      if (typeof data.registrationOpen === 'boolean') setIsOpen(data.registrationOpen);
    }).finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setSaving(true);
    const next = !isOpen;
    try {
      await api.put('/settings', { registrationOpen: next });
      setIsOpen(next);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminPageHeader title="Settings" subtitle="Control conference registration availability." />

      <AdminCard className="p-6 max-w-lg">
        <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-5">Registration Gate</p>

        <div className="flex items-center justify-between gap-6 mb-5">
          <div>
            <p className="font-sans text-sm font-semibold text-comun-white mb-1">Registrations</p>
            <p className="font-sans text-xs text-comun-muted">
              When <span className="text-comun-maroon-light font-semibold">OFF</span>, every Register button on the site shows "Registrations Closed" and the form is inaccessible.
              <br />When <span className="text-emerald-400 font-semibold">ON</span>, the site accepts new registrations normally.
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            role="switch"
            aria-checked={isOpen}
            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${isOpen ? 'bg-emerald-500/80' : 'bg-comun-maroon/70'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isOpen ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
          {saving && <Loader2 className="w-4 h-4 text-comun-gold animate-spin" />}
          <span className={`font-sans text-sm font-semibold ${isOpen ? 'text-emerald-400' : 'text-comun-maroon-light'}`}>
            Registrations are currently {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminSettings;
