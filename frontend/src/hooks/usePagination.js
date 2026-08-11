import { useState, useMemo } from 'react';

/** Tracks page/limit state and exposes helpers for simple offset pagination. */
export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);

  const params = useMemo(() => ({ page, limit }), [page, limit]);

  const nextPage = (totalPages) => setPage((p) => Math.min(p + 1, totalPages || p + 1));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));
  const reset = () => setPage(1);

  return { page, limit, params, setPage, nextPage, prevPage, reset };
}