import React from 'react';

interface BaseProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  className?: string;
}

interface InputProps extends BaseProps {
  as?: 'input';
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TextareaProps extends BaseProps {
  as: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectProps extends BaseProps {
  as: 'select';
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

type FormFieldProps = InputProps | TextareaProps | SelectProps;

/** Themed labelled form control (input / textarea / select) with error display. */
export const FormField: React.FC<FormFieldProps> = (props) => {
  const { label, name, required, error, className = '' } = props;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-comun-gold"> *</span>}
      </label>

      {props.as === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          required={required}
          rows={props.rows ?? 4}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          className="form-input resize-none"
        />
      ) : props.as === 'select' ? (
        <select
          id={name}
          name={name}
          required={required}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="form-input"
        >
          <option value="" disabled>
            {props.placeholder ?? 'Select…'}
          </option>
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={props.type ?? 'text'}
          required={required}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          className="form-input"
        />
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};
