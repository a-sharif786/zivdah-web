import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { productApi } from '../api/productApi';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([]);
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      // GET /products/wishlist has no total-count metadata, so we cap at a
      // generously large single page rather than paginating — fine for the
      // realistic size of a personal wishlist.
      const list = await productApi.getWishlist(0, 200);
      setProducts(list);
      setIds(new Set(list.map((p) => p.id)));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isWishlisted = useCallback((productId) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (product) => {
      const nextFav = !ids.has(product.id);
      // optimistic update
      setIds((prev) => {
        const next = new Set(prev);
        if (nextFav) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
      try {
        await productApi.updateWishlist(product.id, nextFav);
        await refresh();
      } catch {
        await refresh(); // roll back to server truth on failure
      }
    },
    [ids, refresh]
  );

  return (
    <WishlistContext.Provider value={{ products, isWishlisted, toggle, loading, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
