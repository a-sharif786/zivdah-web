import { createContext, useContext, useReducer, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartApi } from '../api/cartApi';
import { productApi } from '../api/productApi';
import { couponApi } from '../api/couponApi';

const CartContext = createContext();

// --- Guest-mode reducer (used while logged out; items keyed by productId) ---
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, qty } = action.payload;
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...product, id: product.id, productId: product.id, quantity: qty }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case 'UPDATE_QTY':
      if (action.payload.qty < 1) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.payload.id ? { ...i, quantity: action.payload.qty } : i)),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}

// Maps a backend CartItemResponseDto + its enriched ProductResponseDto into the
// single item shape every page (Cart/Checkout/Header/ProductCard) consumes.
function toEnrichedItem(cartItem, product) {
  return {
    id: cartItem.id, // cartItemId — required for updateQuantity/removeItem calls
    productId: cartItem.productId,
    quantity: cartItem.quantity,
    price: cartItem.price,
    name: product?.name ?? `Product #${cartItem.productId}`,
    imageUrl: product?.imageUrl,
    unit: product?.unit,
    category: product?.category,
    inStock: product?.inStock ?? true,
    vendorId: product?.vendorId ?? null,
  };
}

export function CartProvider({ children }) {
  const { isAuthenticated, user, registerCartMergeHandler } = useAuth();
  const [guestState, dispatch] = useReducer(cartReducer, { items: [] });
  const [backendItems, setBackendItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, originalAmount, discountAmount, finalAmount }
  const productCache = useRef(new Map());

  const items = isAuthenticated ? backendItems : guestState.items;
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const getProductCached = useCallback(async (productId) => {
    if (productCache.current.has(productId)) return productCache.current.get(productId);
    const product = await productApi.getById(productId).catch(() => null);
    productCache.current.set(productId, product);
    return product;
  }, []);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await cartApi.getMyCart();
      const enriched = await Promise.all(
        raw.map(async (item) => toEnrichedItem(item, await getProductCached(item.productId)))
      );
      setBackendItems(enriched);
    } finally {
      setLoading(false);
    }
  }, [getProductCached]);

  const addItem = useCallback(
    async (product, qty = 1) => {
      if (!isAuthenticated) {
        dispatch({ type: 'ADD_ITEM', payload: { product, qty } });
        return;
      }
      // POST /cart/add never dedupes on the backend — if this product is already in
      // the cart, bump its quantity instead of creating a second row for it.
      const existing = backendItems.find((i) => i.productId === product.id);
      if (existing) {
        await cartApi.updateQuantity(existing.id, existing.quantity + qty);
      } else {
        await cartApi.addToCart({
          userId: user.id,
          productId: product.id,
          quantity: qty,
          price: product.discountPrice ?? product.price,
        });
      }
      await refreshCart();
    },
    [isAuthenticated, user, backendItems, refreshCart]
  );

  const updateQty = useCallback(
    async (id, qty) => {
      if (!isAuthenticated) {
        dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
        return;
      }
      if (qty < 1) {
        await cartApi.removeItem(id);
      } else {
        await cartApi.updateQuantity(id, qty);
      }
      await refreshCart();
    },
    [isAuthenticated, refreshCart]
  );

  const removeItem = useCallback(
    async (id) => {
      if (!isAuthenticated) {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
        return;
      }
      await cartApi.removeItem(id);
      await refreshCart();
    },
    [isAuthenticated, refreshCart]
  );

  const clearCart = useCallback(async () => {
    setAppliedCoupon(null);
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }
    await cartApi.clearMyCart();
    setBackendItems([]);
  }, [isAuthenticated]);

  const applyCoupon = useCallback(
    async (code) => {
      const result = await couponApi.apply({ code, orderAmount: total });
      setAppliedCoupon({ code: result.couponCode, ...result });
      return result;
    },
    [total]
  );

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  // Replays the guest cart into the backend cart at login, then switches this
  // context over to backend mode. Registered with AuthContext so login() can
  // trigger it without a circular import between the two contexts.
  //
  // Takes the just-logged-in user as a parameter rather than reading it off
  // useAuth(): this fires synchronously from inside AuthContext.login(), before
  // React has committed the re-render that would update `isAuthenticated`/`user`
  // here — so it can't route through the memoized addItem() (whose closure would
  // still see the pre-login, unauthenticated state) or trust context values.
  const mergeGuestCartIntoBackend = useCallback(
    async (loggedInUser) => {
      const guestItems = guestState.items;
      dispatch({ type: 'CLEAR_CART' });

      const existing = await cartApi.getMyCart();
      for (const item of guestItems) {
        // eslint-disable-next-line no-await-in-loop -- must run sequentially: each
        // guest item needs the latest known cart state to decide add-vs-update
        const match = existing.find((e) => e.productId === item.productId);
        if (match) {
          // eslint-disable-next-line no-await-in-loop
          await cartApi.updateQuantity(match.id, match.quantity + item.quantity);
          match.quantity += item.quantity;
        } else {
          // eslint-disable-next-line no-await-in-loop
          const created = await cartApi.addToCart({
            userId: loggedInUser.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.discountPrice ?? item.price,
          });
          existing.push(created);
        }
      }
      await refreshCart();
    },
    [guestState.items, refreshCart]
  );

  useEffect(() => {
    registerCartMergeHandler(mergeGuestCartIntoBackend);
  }, [registerCartMergeHandler, mergeGuestCartIntoBackend]);

  // Covers the "already logged in on page load" case (no login() event fires then).
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setBackendItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on auth transitions
  }, [isAuthenticated]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        total,
        count,
        loading,
        isBackendCart: isAuthenticated,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
