import { ReactNode } from 'react';

interface NumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = Infinity,
  prefix,
  suffix,
  hint,
}: NumberInputProps) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (isNaN(v)) {
              onChange(0);
              return;
            }
            onChange(Math.min(Math.max(v, min), max));
          }}
          min={min}
          max={max}
          className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-slate-100 text-sm font-medium transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:outline-none ${
            prefix ? 'pl-7' : 'pl-3.5'
          } ${suffix ? 'pr-10' : 'pr-3.5'}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="block text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: SliderInputProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors ${className}`}>
      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-sm sm:text-base">{subtitle}</p>}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}

export function Stat({ label, value, highlight, muted }: StatProps) {
  return (
    <div
      className={`rounded-xl p-4 border transition-colors ${
        highlight
          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900'
          : muted
          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</div>
      <div
        className={`mt-1 text-lg font-bold ${
          highlight ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
