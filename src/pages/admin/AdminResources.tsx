import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Upload, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner, EmptyState, ConfirmDialog } from '../../components/admin/AdminUI';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Category = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Resource = any;

interface UploadedRef { key: string; fileName: string; mimeType: string; size: number; }

type ResourceSubcategory = 'brochures' | 'guides' | 'templates' | 'others';

const SUBCATEGORY_OPTIONS: { value: ResourceSubcategory; label: string }[] = [
  { value: 'brochures',  label: 'Brochures'  },
  { value: 'guides',     label: 'Guides'     },
  { value: 'templates',  label: 'Templates'  },
  { value: 'others',     label: 'Others'     },
];

async function uploadResourceFile(file: File, subcategory: ResourceSubcategory): Promise<UploadedRef> {
  const contentType = file.type || 'application/octet-stream';
  const { data } = await api.post('/resource-upload-sign', { fileName: file.name, contentType, size: file.size, subcategory });
  const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  if (!put.ok) throw new Error('Upload failed.');
  return { key: data.key, fileName: file.name, mimeType: contentType, size: file.size };
}

const AdminResources: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteResource, setDeleteResource] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);

  // new resource form
  const [rTitle, setRTitle] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rCat, setRCat] = useState('');
  const [rSub, setRSub] = useState<ResourceSubcategory>('others');
  const [rFile, setRFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replaceRef = useRef<{ id: string; input: HTMLInputElement | null }>({ id: '', input: null });

  const load = useCallback(async () => {
    setLoading(true);
    const [cats, res] = await Promise.all([api.get('/resource-categories'), api.get('/admin-resources')]);
    setCategories(cats.data.categories);
    setResources(res.data.resources);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setBusy(true);
    try {
      await api.post('/resource-categories', { name: newCategory.trim() });
      setNewCategory('');
      await load();
    } finally { setBusy(false); }
  };

  const createResource = async () => {
    setError(null);
    if (!rCat || !rTitle.trim() || !rFile) { setError('Category, title and file are required.'); return; }
    setCreating(true);
    try {
      const file = await uploadResourceFile(rFile, rSub);
      await api.post('/admin-resources', { categoryId: rCat, title: rTitle.trim(), description: rDesc.trim(), file });
      setRTitle(''); setRDesc(''); setRCat(''); setRSub('others'); setRFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create resource.');
    } finally { setCreating(false); }
  };

  const toggleResource = async (id: string, isEnabled: boolean) => {
    await api.patch('/admin-resources', { isEnabled: !isEnabled }, { params: { id } });
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: !isEnabled } : r)));
  };

  const replaceFile = async (id: string, file: File, subcategory: ResourceSubcategory = 'others') => {
    setBusy(true);
    try {
      const uploaded = await uploadResourceFile(file, subcategory);
      await api.patch('/admin-resources', { file: uploaded }, { params: { id } });
      await load();
    } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <AdminPageHeader title="Resources" subtitle="Manage categories and downloadable resources." />

      {/* Categories */}
      <AdminCard className="p-5 mb-6">
        <p className="font-sans text-sm text-comun-white/80 mb-3">Categories</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.length === 0 && <span className="font-sans text-xs text-comun-muted">No categories yet.</span>}
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 border border-comun-gold/20 rounded-full font-sans text-xs text-comun-white/80">
              {c.name} <span className="text-comun-muted">({c._count?.resources ?? 0})</span>
              <button onClick={() => setDeleteCategory(c.id)} className="text-comun-muted hover:text-comun-maroon-light"><Trash2 className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className="form-input flex-1" />
          <button onClick={addCategory} disabled={busy} className="btn-secondary text-xs px-4 inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </AdminCard>

      {/* New resource */}
      <AdminCard className="p-5 mb-6">
        <p className="font-sans text-sm text-comun-white/80 mb-3">Add Resource</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <select value={rCat} onChange={(e) => setRCat(e.target.value)} className="form-input">
            <option value="" disabled>Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={rSub} onChange={(e) => setRSub(e.target.value as ResourceSubcategory)} className="form-input">
            {SUBCATEGORY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input value={rTitle} onChange={(e) => setRTitle(e.target.value)} placeholder="Title" className="form-input" />
          <input value={rDesc} onChange={(e) => setRDesc(e.target.value)} placeholder="Description (optional)" className="form-input sm:col-span-2" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input type="file" onChange={(e) => setRFile(e.target.files?.[0] ?? null)} className="font-sans text-xs text-comun-muted file:mr-3 file:px-3 file:py-2 file:border-0 file:bg-comun-gold/15 file:text-comun-gold file:rounded-sm" />
          <button onClick={createResource} disabled={creating} className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2 sm:ml-auto">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {creating ? 'Uploading…' : 'Add Resource'}
          </button>
        </div>
        {error && <p className="form-error mt-2">{error}</p>}
      </AdminCard>

      {/* Resource list */}
      <AdminCard>
        {resources.length === 0 ? (
          <EmptyState message="No resources yet." />
        ) : (
          <div className="divide-y divide-white/5">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-comun-white/85">{r.title} <span className="text-comun-muted text-xs">· {r.category?.name}</span></p>
                  <p className="font-sans text-xs text-comun-muted truncate">{r.file?.fileName || 'No file'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleResource(r.id, r.isEnabled)} className={`px-2.5 py-1 rounded-full font-sans text-[11px] ${r.isEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-comun-maroon/20 text-comun-maroon-light'}`}>
                    {r.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <label className="p-2 text-comun-muted hover:text-comun-gold cursor-pointer" title="Replace file">
                    <RefreshCw className="w-4 h-4" />
                    <input ref={(el) => { if (replaceRef.current.id === r.id) replaceRef.current.input = el; }} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceFile(r.id, f); }} />
                  </label>
                  <button onClick={() => setDeleteResource(r.id)} className="p-2 text-comun-muted hover:text-comun-maroon-light" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <ConfirmDialog open={!!deleteResource} title="Delete Resource?" message="The resource and its file will be permanently removed." onConfirm={async () => { await api.delete('/admin-resources', { params: { id: deleteResource } }); setDeleteResource(null); await load(); }} onCancel={() => setDeleteResource(null)} />
      <ConfirmDialog open={!!deleteCategory} title="Delete Category?" message="All resources in this category and their files will be removed." onConfirm={async () => { await api.delete('/resource-categories', { params: { id: deleteCategory } }); setDeleteCategory(null); await load(); }} onCancel={() => setDeleteCategory(null)} />
    </div>
  );
};

export default AdminResources;
