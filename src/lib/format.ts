export function formatScore(score: number): string {
  return `${score.toFixed(1)}%`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function shortModelName(id: string): string {
  const last = id.split(':').pop() || id;
  return last.split('/').pop() || last;
}

export function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}`;
}

export function formatMoney(value: number | null, decimals = 3): string {
  if (value == null) return '—';
  return `$${value.toFixed(decimals)}`;
}

export function formatCI(lo: number | null, hi: number | null): string {
  if (lo == null || hi == null) return '—';
  return `${lo.toFixed(1)}–${hi.toFixed(1)}`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
