// Shared class strings, so links, buttons and inputs look the same everywhere.

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

export const button = {
  primary: `${base} bg-brand px-5 py-2.5 text-sm text-white hover:bg-brand-dark`,
  outline: `${base} border border-green px-5 py-2.5 text-sm text-green hover:bg-green-tint`,
  ghost: `${base} px-3 py-1.5 text-sm text-green hover:bg-green-tint`,
  danger: `${base} px-3 py-1.5 text-sm text-danger hover:bg-danger-bg`,
  small: `${base} border border-green-line bg-surface px-3 py-1.5 text-xs text-green hover:bg-green-tint`,
  smallDanger: `${base} border border-danger/30 bg-surface px-3 py-1.5 text-xs text-danger hover:bg-danger-bg`,
};

export const input =
  "block w-full rounded-lg border border-green-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-green focus:outline-none focus:ring-2 focus:ring-green/20 sm:text-sm";

export const label = "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";

export const card = "rounded-2xl border border-green-line/70 bg-surface shadow-sm";
