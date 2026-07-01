import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { FormField } from '../../components/ui/FormField';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLogin: React.FC = () => {
  const { login, admin } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admin) navigate('/admin', { replace: true });
  }, [admin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-comun-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm glass-navy gold-border rounded-md p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-comun-maroon via-comun-gold to-comun-maroon" />

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full border border-comun-gold/30 bg-comun-gold/5">
            <ShieldCheck className="w-7 h-7 text-comun-gold" />
          </div>
          <h1 className="font-serif-display text-2xl font-semibold text-gold-gradient">Admin Login</h1>
          <p className="font-sans text-xs text-comun-muted mt-1">CoMUN 2026 Control Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Username" name="username" required value={username} onChange={setUsername} placeholder="username" />
          <FormField label="Password" name="password" type="password" required value={password} onChange={setPassword} placeholder="••••••••" />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary text-sm py-3 mt-1 inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
