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
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/admin-messages', { params: q.trim() ? { q: q.trim() } : {} });
    setMessages(data.messages);
    setUnread(data.unreadCount);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
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

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-comun-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search messages…"
          className="form-input pl-9"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : messages.length === 0 ? (
        <AdminCard><EmptyState message="No messages found." /></AdminCard>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <AdminCard key={m.id} className={`${!m.isRead ? 'border-comun-gold/30' : ''}`}>
              {/* Message header row */}
              <div className="flex items-start justify-between gap-3 p-4">
                <button
                  onClick={() => open(m.id)}
                  className="flex items-start gap-3 text-left flex-1 min-w-0"
                >
                  {m.isRead
                    ? <MailOpen className="w-4 h-4 text-comun-muted mt-0.5 flex-shrink-0" />
                    : <Mail className="w-4 h-4 text-comun-gold mt-0.5 flex-shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className={`font-sans text-sm ${m.isRead ? 'text-comun-white/80' : 'text-comun-white font-semibold'}`}>
                      {m.name}
                      <span className="text-comun-muted font-normal"> · {m.email}</span>
                    </p>
                    <p className="font-sans text-xs text-comun-muted truncate mt-0.5">{m.message}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="font-sans text-[11px] text-comun-muted hidden sm:block mr-1">
                    {m.createdAt.slice(0, 10)}
                  </span>
                  <button
                    onClick={() => replyTo(m.email, m.name)}
                    className="p-1.5 text-comun-muted hover:text-comun-gold transition-colors"
                    title={`Reply to ${m.email}`}
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="p-1.5 text-comun-muted hover:text-comun-maroon-light transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded message body */}
              {openId === m.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <p className="font-sans text-sm text-comun-white/80 leading-relaxed whitespace-pre-wrap">
                    {m.message}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => replyTo(m.email, m.name)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm font-sans text-xs font-semibold border border-comun-gold/25 text-comun-gold hover:bg-comun-gold/10 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply via Email
                    </button>
                    <span className="font-sans text-xs text-comun-muted">{m.email}</span>
                  </div>
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Message?"
        message="This message will be permanently deleted."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default AdminMessages;
