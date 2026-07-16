export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.85) return 'text-emerald-400';
  if (confidence >= 0.70) return 'text-yellow-400';
  return 'text-red-400';
};