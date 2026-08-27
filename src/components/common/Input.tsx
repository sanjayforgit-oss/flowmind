import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  icon,
  error,
  label,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full bg-[#0d121c] border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 transition-all duration-150',
              'focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
              icon ? 'pl-9 pr-3.5 py-2' : 'px-3.5 py-2',
              error && 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};
