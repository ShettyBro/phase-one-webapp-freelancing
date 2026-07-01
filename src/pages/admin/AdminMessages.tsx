import React, { useEffect, useState, useCallback } from 'react';
import { Search, Trash2, Mail, MailOpen } from 'lucide-react';
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
      setDeleteId(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Messages" subtitle={`${unread} unread`} />

      <div className="relative mb-4">
        <Search className="w-4 h-4 text-comun-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" className="form-input pl-9" />
      </div>

      {loading ? (
        <Spinner />
      ) : messages.length === 0 ? (
        <AdminCard><EmptyState message="No messages found." /></AdminCard>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <AdminCard key={m.id} className={`p-4 ${!m.isRead ? 'border-comun-gold/30' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => open(m.id)} className="flex items-start gap-3 text-left flex-1 min-w-0">
                  {m.isRead ? <MailOpen className="w-4 h-4 text-comun-muted mt-1 flex-shrink-0" /> : <Mail className="w-4 h-4 text-comun-gold mt-1 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className={`font-sans text-sm ${m.isRead ? 'text-comun-white/80' : 'text-comun-white font-semibold'}`}>{m.name} <span className="text-comun-muted font-normal">· {m.email}</span></p>
                    <p className="font-sans text-xs text-comun-muted truncate">{m.message}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-sans text-[11px] text-comun-muted hidden sm:block">{m.createdAt.slice(0, 10)}</span>
                  <button onClick={() => setDeleteId(m.id)} className="p-1.5 text-comun-muted hover:text-comun-maroon-light" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {openId === m.id && (
                <p className="font-sans text-sm text-comun-white/80 leading-relaxed mt-3 pt-3 border-t border-white/5 whitespace-pre-wrap">{m.message}</p>
              )}
            </AdminCard>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Message?" message="This message will be permanently deleted." loading={deleting} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default AdminMessages;
