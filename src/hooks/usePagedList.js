import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;

/**
 * List endpoints in zivdah-api return a bare array with no total count. This hook
 * drives a "Load more" UX by requesting one extra item per page to know whether
 * another page exists, without ever fabricating a count the backend doesn't provide.
 * `fetchPage(page, sizePlusOne)` should be a stable callback (e.g. wrapped in useCallback
 * by the caller, or defined inline in a useEffect dependency list including its own inputs).
 */
export function usePagedList(fetchPage, deps = []) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPage = useCallback(
    async (pageToLoad, append) => {
      setLoading(true);
      setError(null);
      try {
        const raw = await fetchPage(pageToLoad, PAGE_SIZE + 1);
        const more = raw.length > PAGE_SIZE;
        const pageItems = more ? raw.slice(0, PAGE_SIZE) : raw;
        setItems((prev) => (append ? [...prev, ...pageItems] : pageItems));
        setHasMore(more);
        setPage(pageToLoad);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage identity intentionally excluded, see deps param
    deps
  );

  useEffect(() => {
    loadPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = () => loadPage(page + 1, true);

  return { items, hasMore, loading, error, loadMore };
}
