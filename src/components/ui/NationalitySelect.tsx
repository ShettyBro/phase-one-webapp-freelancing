import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES } from '../../data/countries';

interface NationalitySelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  label?: string;
}

/** Searchable nationality autocomplete (themed dropdown). */
export const NationalitySelect: React.FC<NationalitySelectProps> = ({
  value,
  onChange,
  required,
  error,
  label = 'Nationality',
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? COUNTRIES.filter((c) => c.toLowerCase().includes(q)) : COUNTRIES;
    return list.slice(0, 8);
  }, [query]);

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-2">
      <label className="form-label">
        {label}
        {required && <span className="text-comun-gold"> *</span>}
      </label>

      <input
        value={query}
        placeholder="Search nationality…"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="form-input"
        autoComplete="off"
      />

      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-56 overflow-auto glass-navy gold-border rounded-md shadow-card">
          {matches.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => {
                onChange(c);
                setQuery(c);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 font-sans text-sm text-comun-white/80 hover:bg-comun-gold/10 hover:text-comun-gold transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
