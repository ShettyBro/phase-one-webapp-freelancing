import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Eye, Trash2, X, FileDown, Download, FileSpreadsheet,
  Archive, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { getToken } from '../../utils/auth';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminPageHeader, AdminCard, Spinner, EmptyState, ConfirmDialog } from '../../components/admin/AdminUI';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const PAGE_SIZE = 25;

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

type SortKey = 'applicationId' | 'submittedAt' | 'primaryName';
type SortDir = 'asc' | 'desc';

// ── Export helper — raw fetch to avoid Content-Type:application/json ──────
async function downloadExport(type: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/admin-export?type=${type}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const AdminRegistrations: React.FC = () => {
  const { isSuperAdmin } = useAdminAuth();
  const [all, setAll] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exportBusy, setExportBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (type) params.type = type;
    const { data } = await api.get('/admin-registrations', { params });
    setAll(data.registrations);
    setPage(1);
    setLoading(false);
  }, [q, type]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // ── Sort ────────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = [...all].sort((a, b) => {
    let av = '', bv = '';
    if (sortKey === 'applicationId') { av = a.applicationId; bv = b.applicationId; }
    else if (sortKey === 'submittedAt') { av = a.submittedAt; bv = b.submittedAt; }
    else if (sortKey === 'primaryName') { av = a.primaryName ?? ''; bv = b.primaryName ?? ''; }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k ? null :
    sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;

  // ── Detail drawer ───────────────────────────────────────────────────────
  const openDetail = async (id: string) => {
    setDetailId(id); setDetail(null);
    const { data } = await api.get('/admin-registrations', { params: { id } });
    setDetail(data.registration);
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete('/admin-registrations', { params: { id: deleteId } });
      setDeleteId(null); setDetailId(null);
      await load();
    } finally { setDeleting(false); }
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const doExport = async (exportType: string, filename: string) => {
    setExportBusy(exportType);
    try { await downloadExport(exportType, filename); }
    catch { alert('Export failed — please try again.'); }
    finally { setExportBusy(null); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Registrations"
        subtitle={`${all.length} total record${all.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ExportBtn label="Single XLSX" busy={exportBusy === 'individual-single'} icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              onClick={() => doExport('individual-single', 'Individual_Single_Delegates.xlsx')} />
            <ExportBtn label="Double XLSX" busy={exportBusy === 'individual-double'} icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              onClick={() => doExport('individual-double', 'Individual_Double_Delegates.xlsx')} />
            {/* Fix #11 — ZIP exports (bulk PII) only shown to SUPER_ADMIN */}
            {isSuperAdmin && (
              <>
                <ExportBtn label="Institution ZIP" busy={exportBusy === 'institutional-zip'} icon={<Archive className="w-3.5 h-3.5" />}
                  onClick={() => doExport('institutional-zip', 'Institutional_Registrations.zip')} />
                <ExportBtn label="ID Proofs ZIP" busy={exportBusy === 'id-proof-zip'} icon={<Archive className="w-3.5 h-3.5" />}
                  onClick={() => doExport('id-proof-zip', 'Individual_ID_Proofs.zip')} />
              </>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-comun-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name, email, institution…" className="form-input pl-9" />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="form-input sm:w-52">
          <option value="">All Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="INSTITUTIONAL">Institutional</option>
        </select>
      </div>

      <AdminCard>
        {loading ? <Spinner /> : rows.length === 0 ? <EmptyState message="No registrations found." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-comun-gold/10 text-comun-muted font-sans text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-comun-white" onClick={() => toggleSort('applicationId')}>
                    App ID <SortIcon k="applicationId" />
                  </th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 hidden md:table-cell cursor-pointer select-none hover:text-comun-white" onClick={() => toggleSort('primaryName')}>
                    Name / Institution <SortIcon k="primaryName" />
                  </th>
                  <th className="px-4 py-3 hidden lg:table-cell">Committee</th>
                  <th className="px-4 py-3 hidden lg:table-cell cursor-pointer select-none hover:text-comun-white" onClick={() => toggleSort('submittedAt')}>
                    Date <SortIcon k="submittedAt" />
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] font-sans text-sm">
                    <td className="px-4 py-3 text-comun-gold font-medium">{r.applicationId}</td>
                    <td className="px-4 py-3 text-comun-white/80">
                      {r.type === 'INDIVIDUAL' ? `Ind · ${r.delegationType === 'DOUBLE' ? 'Double' : 'Single'}` : 'Institutional'}
                    </td>
                    <td className="px-4 py-3 text-comun-white/70 hidden md:table-cell">{r.primaryName ?? r.institutionName ?? '—'}</td>
                    <td className="px-4 py-3 text-comun-white/70 hidden lg:table-cell">{r.committee ?? '—'}</td>
                    <td className="px-4 py-3 text-comun-muted hidden lg:table-cell">{r.submittedAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(r.id)} className="p-2 text-comun-muted hover:text-comun-gold transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        {/* Fix #11 — Delete only shown to SUPER_ADMIN */}
                        {isSuperAdmin && (
                          <button onClick={() => setDeleteId(r.id)} className="p-2 text-comun-muted hover:text-comun-maroon-light transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 font-sans text-sm">
            <span className="text-comun-muted text-xs">
              Page {page} of {totalPages} · {all.length} records
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 text-comun-muted hover:text-comun-gold disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded-sm text-xs ${pg === page ? 'bg-comun-gold/20 text-comun-gold' : 'text-comun-muted hover:text-comun-white'}`}
                  >{pg}</button>
                );
              })}
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 text-comun-muted hover:text-comun-gold disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </AdminCard>

      {/* Detail drawer */}
      <AnimatePresence>
        {detailId && (
          <>
            <motion.div className="fixed inset-0 z-[150] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailId(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 z-[151] w-full max-w-md bg-comun-charcoal border-l border-comun-gold/15 overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-comun-gold/10 sticky top-0 bg-comun-charcoal z-10">
                <h3 className="font-serif-display text-lg text-comun-gold">Registration Detail</h3>
                <button onClick={() => setDetailId(null)} className="p-1.5 text-comun-muted hover:text-comun-gold"><X className="w-5 h-5" /></button>
              </div>
              {!detail ? <Spinner /> : <RegistrationDetail detail={detail} regId={detailId} onDelete={isSuperAdmin ? () => setDeleteId(detailId) : undefined} />}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!deleteId} title="Delete Registration?" message="This permanently removes the record and all uploaded files. Cannot be undone."
        loading={deleting} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

// ── Small export button ─────────────────────────────────────────────────────
const ExportBtn: React.FC<{ label: string; busy: boolean; icon: React.ReactNode; onClick: () => void }> = ({ label, busy, icon, onClick }) => (
  <button onClick={onClick} disabled={busy}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-sans text-xs font-semibold border border-comun-gold/25 text-comun-gold/80 hover:bg-comun-gold/10 hover:text-comun-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
    {label}
  </button>
);

// ── Registration detail drawer content ────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RegistrationDetail: React.FC<{ detail: any; regId: string; onDelete?: () => void }> = ({ detail, regId, onDelete }) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin-registration-pdf?id=${regId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('PDF failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${detail.applicationId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally { setPdfLoading(false); }
  };

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5">
      <span className="font-sans text-xs text-comun-muted uppercase tracking-wider flex-shrink-0">{label}</span>
      <span className="font-sans text-sm text-comun-white/85 text-right break-all">{value || '—'}</span>
    </div>
  );

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-serif-display text-2xl text-comun-gold">{detail.applicationId}</p>
          <p className="font-sans text-xs text-comun-muted">{detail.type === 'INDIVIDUAL' ? `Individual · ${detail.delegationType}` : 'Institutional'}</p>
        </div>
        <button onClick={downloadPdf} disabled={pdfLoading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-sm font-sans text-xs border border-comun-gold/30 text-comun-gold hover:bg-comun-gold/10 transition-colors disabled:opacity-50 flex-shrink-0">
          <Download className="w-3.5 h-3.5" />
          {pdfLoading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <Row label="Submitted" value={String(detail.submittedAt).slice(0, 10)} />
      <Row label="Amount Payable" value={detail.amountPayable > 0 ? `INR ${detail.amountPayable}` : 'At desk'} />
      {detail.committee && <Row label="Committee" value={detail.committee} />}
      {detail.portfolio && <Row label="Portfolio" value={detail.portfolio} />}

      {detail.type === 'INSTITUTIONAL' && (
        <div className="mt-4">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-2">Institution</p>
          <Row label="Name" value={detail.institutionName} />
          <Row label="Teacher" value={`${detail.teacherName} · ${detail.teacherEmail}`} />
          <Row label="Teacher Phone" value={detail.teacherPhone} />
          <Row label="Head Delegate" value={`${detail.headName} · ${detail.headEmail}`} />
          <Row label="Head Phone" value={detail.headPhone} />
        </div>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {Array.isArray(detail.files) && detail.files.length > 0 && (
        <div className="mt-4">
          <p className="font-sans text-xs text-comun-gold/70 uppercase tracking-widest mb-2">Uploaded Files</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {detail.files.map((f: any) => (
            <a key={f.id} href={f.downloadUrl || '#'} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-2 py-2 font-sans text-sm ${f.downloadUrl ? 'text-comun-gold hover:text-comun-gold-light' : 'text-comun-muted pointer-events-none'}`}>
              <FileDown className="w-4 h-4" /> {f.fileName}
              <span className="text-comun-muted text-xs ml-auto">({f.kind})</span>
            </a>
          ))}
        </div>
      )}

      {onDelete && (
        <button onClick={onDelete}
          className="mt-6 w-full text-sm px-5 py-2.5 rounded-sm font-sans font-semibold uppercase tracking-wider bg-comun-maroon/80 text-white hover:bg-comun-maroon transition-colors inline-flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete Registration
        </button>
      )}
    </div>
  );
};

export default AdminRegistrations;
