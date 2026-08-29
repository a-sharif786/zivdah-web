import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';

// Module-level cache (not per-component) so every ProductCard/ProductDetail showing the
// same vendor shares one lookup instead of firing its own request — vendor display names
// are effectively static for the lifetime of a page session. `GET /auth/byUserId/{id}` is
// a public endpoint, so this needs no auth token.
const vendorNameCache = new Map();

/**
 * Resolves a product's `vendorId` to the vendor's display name for "Sold by ..."
 * attribution. Returns `null` when there's nothing to show yet (no vendorId — a
 * platform-owned product — still loading, or the lookup failed); returns the name
 * string once resolved.
 */
export function useVendorName(vendorId) {
  const [name, setName] = useState(() => (vendorId != null ? vendorNameCache.get(vendorId) ?? null : null));

  useEffect(() => {
    if (vendorId == null) {
      setName(null);
      return;
    }
    if (vendorNameCache.has(vendorId)) {
      setName(vendorNameCache.get(vendorId));
      return;
    }
    let cancelled = false;
    authApi
      .getUserById(vendorId)
      .then((u) => {
        const resolved = u?.name ?? null;
        vendorNameCache.set(vendorId, resolved);
        if (!cancelled) setName(resolved);
      })
      .catch(() => {
        vendorNameCache.set(vendorId, null);
        if (!cancelled) setName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  return name;
}
