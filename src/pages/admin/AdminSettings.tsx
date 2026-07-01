import React, { useEffect, useState } from 'react';
import { Loader2, Save, Info } from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner } from '../../components/admin/AdminUI';

interface SettingsState {
  registrationOpen: boolean;
  conferenceStartDate: string;
  conferenceEndDate: string;
  venue: string;
  contactEmail: string;
  announcementBanner: string;
}

const DEFAULTS: SettingsState = {
  registrationOpen: true,
  conferenceStartDate: '2026-07-30',
  conferenceEndDate: '2026-08-01',
  venue: 'Cottons Higher Secondary School, Bangalore',
  contactEmail: 'comun2026@cottons.edu.in',
  announcementBanner: '',
};

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setSettings((prev) => ({ ...prev, registrationOpen: data.registrationOpen }));
    }).finally(() => setLoading(false));
  }, []);

  const toggleRegistration = async () => {
    setSaving(true);
    const next = !settings.registrationOpen;
    try {
      await api.put('/settings', { registrationOpen: next });
      setSettings((prev) => ({ ...prev, registrationOpen: next }));
    } finally {
      setSaving(false);
    }
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      // These are informational fields stored in the frontend/config for now.
      // In a full implementation they'd be stored in DB settings table.
      await new Promise((r) => setTimeout(r, 600)); // simulate save
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminPageHeader title="Settings" subtitle="Conference registration controls and information." />

      <div className="flex flex-col gap-6">

        {/* ── Registration Toggle ────────────────────────────────────────── */}
        <AdminCard className="p-6">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-4">Registration Control</p>
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="font-sans text-sm text-comun-white font-semibold mb-1">Registration Gate</p>
              <p className="font-sans text-xs text-comun-muted">
                When OFF, every Register button on the site shows "Registrations Closed" and the form is inaccessible.
              </p>
            </div>
            <button
              onClick={toggleRegistration}
              disabled={saving}
              role="switch"
              aria-checked={settings.registrationOpen}
              className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${settings.registrationOpen ? 'bg-emerald-500/80' : 'bg-comun-maroon/70'} disabled:opacity-60`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${settings.registrationOpen ? 'translate-x-7' : ''}`} />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 text-comun-gold animate-spin" />}
            <span className={`font-sans text-sm font-semibold ${settings.registrationOpen ? 'text-emerald-400' : 'text-comun-maroon-light'}`}>
              Registrations are currently {settings.registrationOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
        </AdminCard>

        {/* ── Conference Info ────────────────────────────────────────────── */}
        <AdminCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest">Conference Information</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-comun-gold/10 border border-comun-gold/20">
              <Info className="w-3 h-3 text-comun-gold/60" />
              <span className="font-sans text-[10px] text-comun-gold/60">Display reference — not yet persisted to DB</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-sans text-xs text-comun-muted uppercase tracking-wider block mb-1.5">Start Date</label>
              <input
                type="date"
                value={settings.conferenceStartDate}
                onChange={(e) => set('conferenceStartDate', e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="font-sans text-xs text-comun-muted uppercase tracking-wider block mb-1.5">End Date</label>
              <input
                type="date"
                value={settings.conferenceEndDate}
                onChange={(e) => set('conferenceEndDate', e.target.value)}
                className="form-input w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-sans text-xs text-comun-muted uppercase tracking-wider block mb-1.5">Venue</label>
              <input
                type="text"
                value={settings.venue}
                onChange={(e) => set('venue', e.target.value)}
                className="form-input w-full"
                placeholder="Venue name and address"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-sans text-xs text-comun-muted uppercase tracking-wider block mb-1.5">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                className="form-input w-full"
                placeholder="comun2026@example.com"
              />
            </div>
          </div>

          <button
            onClick={saveInfo}
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-sans text-xs font-semibold uppercase tracking-wider bg-comun-gold/15 text-comun-gold border border-comun-gold/25 hover:bg-comun-gold/25 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </AdminCard>

        {/* ── Announcement Banner ────────────────────────────────────────── */}
        <AdminCard className="p-6">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-4">Announcement Banner</p>
          <p className="font-sans text-xs text-comun-muted mb-3">
            Optional banner text displayed at the top of the landing page. Leave empty to hide.
          </p>
          <textarea
            value={settings.announcementBanner}
            onChange={(e) => set('announcementBanner', e.target.value)}
            rows={3}
            className="form-input w-full resize-none"
            placeholder="e.g. Early bird registration ends July 15th — Register now to secure your spot!"
          />
          <button
            onClick={saveInfo}
            disabled={saving}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-sans text-xs font-semibold uppercase tracking-wider bg-comun-gold/15 text-comun-gold border border-comun-gold/25 hover:bg-comun-gold/25 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Banner'}
          </button>
        </AdminCard>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <AdminCard className="p-6 border-comun-maroon/30">
          <p className="font-sans text-xs text-comun-maroon-light uppercase tracking-widest mb-4">Danger Zone</p>
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="font-sans text-sm text-comun-white font-semibold mb-1">Force Close Registrations</p>
              <p className="font-sans text-xs text-comun-muted">Immediately closes registrations regardless of current state. Use the toggle above to reopen.</p>
            </div>
            <button
              onClick={async () => {
                if (!settings.registrationOpen) return;
                setSaving(true);
                try { await api.put('/settings', { registrationOpen: false }); setSettings((p) => ({ ...p, registrationOpen: false })); }
                finally { setSaving(false); }
              }}
              disabled={saving || !settings.registrationOpen}
              className="flex-shrink-0 px-4 py-2 rounded-sm font-sans text-xs font-semibold uppercase tracking-wider bg-comun-maroon/20 text-comun-maroon-light border border-comun-maroon/30 hover:bg-comun-maroon/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Force Close
            </button>
          </div>
        </AdminCard>

      </div>
    </div>
  );
};

export default AdminSettings;
