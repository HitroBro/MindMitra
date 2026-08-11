export const formatDate = (date, opts = {}) =>
  new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...opts });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatRelativeTime = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

export const severityLabel = (severity) => (severity || '').replace(/_/g, ' ');

export const riskColor = {
  high: 'bg-clay-500/10 text-clay-600',
  medium: 'bg-amber-500/10 text-amber-600',
  low: 'bg-teal-600/10 text-teal-700',
};

export const truncate = (str, len = 100) => (str && str.length > len ? `${str.slice(0, len)}…` : str);