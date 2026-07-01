import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, X, Loader2 } from 'lucide-react';
import { uploadFile, validateFile, UPLOAD_LIMITS, type UploadKind, type UploadedRef } from '../../utils/uploadFile';

interface FileUploadProps {
  label: string;
  kind: UploadKind;
  required?: boolean;
  value: UploadedRef | null;
  onChange: (ref: UploadedRef | null) => void;
  error?: string;
}

/** Themed file picker that uploads directly to R2 and reports the stored ref. */
export const FileUpload: React.FC<FileUploadProps> = ({ label, kind, required, value, onChange, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const limit = UPLOAD_LIMITS[kind];

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    const validationError = validateFile(kind, file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setUploading(true);
    try {
      const ref = await uploadFile(kind, file);
      onChange(ref);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Upload failed.');
      onChange(null);
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const shownError = error || localError;

  return (
    <div className="flex flex-col gap-2">
      <label className="form-label">
        {label}
        {required && <span className="text-comun-gold"> *</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={limit.accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border border-comun-gold/25 bg-comun-gold/5 rounded-sm">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-sans text-sm text-comun-white/85 truncate">{value.fileName}</span>
          </div>
          <button type="button" onClick={clear} className="p-1 text-comun-muted hover:text-comun-maroon-light transition-colors" aria-label="Remove file">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-3 px-4 py-3 border border-dashed border-comun-gold/25 hover:border-comun-gold/50 bg-white/[0.02] rounded-sm transition-colors text-left disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-comun-gold animate-spin flex-shrink-0" />
          ) : (
            <UploadCloud className="w-5 h-5 text-comun-gold flex-shrink-0" />
          )}
          <span className="flex flex-col">
            <span className="font-sans text-sm text-comun-white/80">
              {uploading ? 'Uploading…' : 'Click to upload'}
            </span>
            <span className="font-sans text-[11px] text-comun-muted">{limit.label}</span>
          </span>
        </button>
      )}

      {shownError && <span className="form-error">{shownError}</span>}
    </div>
  );
};
