import React, { useEffect, useState, useCallback } from 'react';
import { Search, Eye, Trash2, X, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner, EmptyState, ConfirmDialog } from '../../components/admin/AdminUI';

interface RegRow {
  id: string;
  applicationId: string;
  type: 'INDIVIDUAL' | 'INSTITUTIONAL';
  delegationType: 'SINGLE' | 'DOUBLE' | null;
  committee: string | null;
  institutionName: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  submittedAt: string;
}

const AdminRegistrations: React.FC = () => {
  const [rows, setRows] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (type) params.type = type;
    const { data } = await api.get('/admin-registrations', { params });
    setRows(data.registrations);
    setLoading(false);
  }, [q, type]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    const { data } = await api.get('/admin-registrations', { params: { id } });
    setDetail(data.registration);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete('/admin-registrations', { params: { id: deleteId } });
      setDeleteId(null);
      setDetailId(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Registrations" subtitle="Search, view and manage all registrations." />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-comun-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name, email, institution…" className="form-input pl-9" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="form-input sm:w-56">
          <option value="">All Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="INSTITUTIONAL">Institutional</option>
        </select>
      </div>

      <AdminCard>
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState message="No registrations found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-comun-gold/10 text-comun-muted font-sans text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">Application ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 hidden md:table-cell">Name / Institution</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Committee</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] font-sans text-sm">
                    <td className="px-4 py-3 text-comun-gold font-medium">{r.applicationId}</td>
                    <td className="px-4 py-3 text-comun-white/80">
                      {r.type === 'INDIVIDUAL' ? `Individual · ${r.delegationType === 'DOUBLE' ? 'Double' : 'Single'}` : 'Institutional'}
                    </td>
                    <td className="px-4 py-3 text-comun-white/70 hidden md:table-cell">{r.primaryName || r.institutionName || '—'}</td>
                    <td className="px-4 py-3 text-comun-white/70 hidden lg:table-cell">{r.committee || '—'}</td>
                    <td className="px-4 py-3 text-comun-muted hidden lg:table-cell">{r.submittedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(r.id)} className="p-2 text-comun-muted hover:text-comun-gold transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(r.id)} className="p-2 text-comun-muted hover:text-comun-maroon-light transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailId && (
          <>
            <motion.div className="fixed inset-0 z-[150] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailId(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-[151] w-full max-w-md bg-comun-charcoal border-l border-comun-gold/15 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-comun-gold/10 sticky top-0 bg-comun-charcoal">
                <h3 className="font-serif-display text-lg text-comun-gold">Registration</h3>
                <button onClick={() => setDetailId(null)} className="p-1.5 text-comun-muted hover:text-comun-gold"><X className="w-5 h-5" /></button>
              </div>
              {!detail ? <Spinner /> : <RegistrationDetail detail={detail} onDelete={() => setDeleteId(detailId)} />}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Registration?"
        message="This permanently removes the record and its uploaded files. This cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RegistrationDetail: React.FC<{ detail: any; onDelete: () => void }> = ({ detail, onDelete }) => {
  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5">
      <span className="font-sans text-xs text-comun-muted uppercase tracking-wider">{label}</span>
      <span className="font-sans text-sm text-comun-white/85 text-right">{value || '—'}</span>
    </div>
  );
  return (
    <div className="p-5">
      <div className="mb-4">
        <p className="font-serif-display text-2xl text-comun-gold">{detail.applicationId}</p>
        <p className="font-sans text-xs text-comun-muted">{detail.type === 'INDIVIDUAL' ? `Individual · ${detail.delegationType}` : 'Institutional'}</p>
      </div>

      {detail.committee && <Row label="Committee" value={detail.committee} />}
      {detail.portfolio && <Row label="Portfolio" value={detail.portfolio} />}
      <Row label="Submitted" value={String(detail.submittedAt).slice(0, 10)} />
      <Row label="Amount" value={detail.amountPayable > 0 ? `INR ${detail.amountPayable}` : 'At desk'} />

      {detail.type === 'INSTITUTIONAL' && (
        <div className="mt-4">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-2">Institution</p>
          <Row label="Name" value={detail.institutionName} />
          <Row label="Teacher" value={`${detail.teacherName} · ${detail.teacherEmail}`} />
          <Row label="Teacher Phone" value={detail.teacherPhone} />
          <Row label="Head" value={`${detail.headName} · ${detail.headEmail}`} />
          <Row label="Head Phone" value={detail.headPhone} />
        </div>
      )}

      {Array.isArray(detail.delegates) && detail.delegates.map((d: any) => (
        <div key={d.id} className="mt-4">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-2">Delegate {d.position}</p>
          <Row label="Name" value={d.name} />
          <Row label="Email" value={d.email} />
          <Row label="Phone" value={d.phone} />
          <Row label="Grade" value={d.grade} />
          <Row label="Nationality" value={d.nationality} />
          <Row label="Experience" value={d.experience} />
          {d.institution && <Row label="Institution" value={d.institution} />}
        </div>
      ))}

      {Array.isArray(detail.files) && detail.files.length > 0 && (
        <div className="mt-4">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-2">Files</p>
          {detail.files.map((f: any) => (
            <a key={f.id} href={f.downloadUrl || '#'} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 py-2 font-sans text-sm ${f.downloadUrl ? 'text-comun-gold hover:text-comun-gold-light' : 'text-comun-muted pointer-events-none'}`}>
              <FileDown className="w-4 h-4" /> {f.fileName} <span className="text-comun-muted text-xs">({f.kind})</span>
            </a>
          ))}
        </div>
      )}

      <button onClick={onDelete} className="mt-6 w-full text-sm px-5 py-2.5 rounded-sm font-sans font-semibold uppercase tracking-wider bg-comun-maroon/80 text-white hover:bg-comun-maroon transition-colors inline-flex items-center justify-center gap-2">
        <Trash2 className="w-4 h-4" /> Delete Registration
      </button>
    </div>
  );
};

export default AdminRegistrations;
