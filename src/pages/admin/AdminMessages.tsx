import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, Mail, MailOpen, Reply, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import { AdminPageHeader, AdminCard, Spinner, EmptyState, ConfirmDialog } from '../../components/admin/AdminUI';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // B4 — cancel in-flight requests when query changes to prevent stale results.
  const abortRef = React.useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    // Cancel any previous in-flight request.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get('/admin-messages', {
        params: q.trim() ? { q: q.trim() } : {},
        signal: controller.signal,
      });
      setMessages(data.messages);
      setUnread(data.unreadCount);
    } catch (err: unknown) {
      // Ignore intentional cancellations (query changed).
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'CanceledError') return;
      // B5 — surface the error instead of silently leaving loading=true.
      setLoadError('Could not load messages. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    // Cancel the debounced request on cleanup.
    return () => { clearTimeout(t); abortRef.current?.abort(); };
  }, [load]);

  const open = async (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
    const msg = messages.find((m) => m.id === id);
    if (msg && !msg.isRead) {
      await api.get('/admin-messages', { params: { id } });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
      setUnread((u) => Math.max(0, u - 1));
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete('/admin-messages', { params: { id: deleteId } });
      if (openId === deleteId) setOpenId(null);
      setDeleteId(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const replyTo = (email: string, name: string) => {
    const subject = encodeURIComponent('Re: Your message to CoMUN 2026');
    const body = encodeURIComponent(`Dear ${name},\n\nThank you for reaching out to CoMUN 2026.\n\n`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div>
      <AdminPageHeader
        title="Messages"
        subtitle={`${unread} unread`}
        actions={
          <button
            onClick={load}
            className="p-2 text-comun-muted hover:text-comun-gold transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-comun-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" className="form-input pl-9" />
      </div>

      <AdminCard>
        {loading ? <Spinner /> : loadError ? (
          // B5 — visible error + retry instead of silent infinite spinner.
          <div className="p-8 text-center">
            <p className="font-sans text-sm text-comun-maroon-light mb-4">{loadError}</p>
            <button onClick={() => load()} className="btn-secondary text-sm px-6 py-2.5">Retry</button>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState message="No messages yet." />
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => open(m.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {m.isRead
                        ? <MailOpen className="w-4 h-4 text-comun-muted flex-shrink-0" />
                        : <Mail className="w-4 h-4 text-comun-gold flex-shrink-0" />}
                      <span className={`font-sans text-sm truncate ${m.isRead ? 'text-comun-white/70' : 'text-comun-white font-semibold'}`}>
                        {m.name}
                      </span>
                      <span className="font-sans text-xs text-comun-muted ml-auto flex-shrink-0">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-comun-muted truncate">{m.email}</p>
                    {openId !== m.id && (
                      <p className="font-sans text-xs text-comun-white/50 truncate mt-1">{m.message}</p>
                    )}
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => replyTo(m.email, m.name)} className="p-1.5 text-comun-muted hover:text-comun-gold transition-colors" title="Reply"><Reply className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(m.id)} className="p-1.5 text-comun-muted hover:text-comun-maroon-light transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {openId === m.id && (
                  <div className="mt-3 pl-6 font-sans text-sm text-comun-white/80 whitespace-pre-wrap border-l-2 border-comun-gold/20 leading-relaxed">
                    {m.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Message?"
        message="This permanently removes the message. Cannot be undone."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default AdminMessages;
