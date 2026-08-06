"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product, ProductVariant } from "@/types";
import { cartItemKey, getProductPrice } from "@/utils/format";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/services/api";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ecomm-cart-v2";
const PENDING_CLEAR_KEY = "ecomm-cart-pending-clear";

function readLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function markPendingClear() {
  try {
    sessionStorage.setItem(PENDING_CLEAR_KEY, "1");
  } catch {
    /* ignore */
  }
}

function clearPendingClear() {
  try {
    sessionStorage.removeItem(PENDING_CLEAR_KEY);
  } catch {
    /* ignore */
  }
}

function hasPendingClear() {
  try {
    return sessionStorage.getItem(PENDING_CLEAR_KEY) === "1";
  } catch {
    return false;
  }
}

function serializeCart(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.product.id,
    variantId: item.variant?.id || null,
    quantity: item.quantity,
  }));
}

/** Merge guest cart into account cart (sum quantities once on login). */
function mergeCarts(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of remote) {
    map.set(cartItemKey(item.product.id, item.variant?.id), { ...item });
  }

  for (const item of local) {
    const key = cartItemKey(item.product.id, item.variant?.id);
    const existing = map.get(key);
    const stock = item.variant ? item.variant.stock : item.product.stock;

    if (existing) {
      map.set(key, {
        ...existing,
        quantity: Math.min(existing.quantity + item.quantity, stock),
      });
    } else {
      map.set(key, {
        ...item,
        quantity: Math.min(item.quantity, stock),
      });
    }
  }

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [localReady, setLocalReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const skipSync = useRef(true);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** undefined = first auth resolve, null = guest, string = logged-in user id */
  const prevUserId = useRef<string | null | undefined>(undefined);

  const pushToServer = useCallback(
    async (next: CartItem[]) => {
      if (!user) return;
      try {
        await api.syncCart(serializeCart(next));
      } catch (err) {
        console.error("Failed to sync cart:", err);
      }
    },
    [user]
  );

  // Load guest/local cache immediately
  useEffect(() => {
    setItems(readLocalCart());
    setLocalReady(true);
  }, []);

  // Hydrate from server when logged in. Only sum-merge guest → account on login.
  useEffect(() => {
    if (!localReady || authLoading) return;

    let cancelled = false;

    async function hydrate() {
      skipSync.current = true;
      const previous = prevUserId.current;
      const nextUserId = user?.id ?? null;

      try {
        if (!user) {
          if (hasPendingClear()) {
            setItems([]);
            writeLocalCart([]);
            clearPendingClear();
          }
          prevUserId.current = null;
          return;
        }

        // Payment success may clear before auth/hydrate finishes — honor that.
        if (hasPendingClear()) {
          try {
            await api.clearServerCart();
          } catch (err) {
            console.error("Failed to clear cart:", err);
          }
          if (cancelled) return;
          setItems([]);
          writeLocalCart([]);
          clearPendingClear();
          prevUserId.current = nextUserId;
          return;
        }

        const remote = (await api.getCart()).data?.items || [];
        if (cancelled) return;

        // Cleared while getCart was in flight
        if (hasPendingClear()) {
          try {
            await api.clearServerCart();
          } catch (err) {
            console.error("Failed to clear cart:", err);
          }
          if (cancelled) return;
          setItems([]);
          writeLocalCart([]);
          clearPendingClear();
          prevUserId.current = nextUserId;
          return;
        }

        // Guest → logged in: merge guest localStorage into account once
        const loggingIn = previous === null;
        let next = remote;

        if (loggingIn) {
          const local = readLocalCart();
          if (local.length > 0) {
            next = mergeCarts(local, remote);
            const syncRes = await api.syncCart(serializeCart(next));
            if (cancelled) return;
            next = syncRes.data?.items || next;
          }
        }

        // Refresh / already logged in: server is source of truth (no quantity summing)
        setItems(next);
        writeLocalCart(next);
        prevUserId.current = nextUserId;
      } catch (err) {
        console.error("Failed to load cart:", err);
        prevUserId.current = nextUserId;
      } finally {
        if (!cancelled) {
          skipSync.current = false;
          setHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, localReady]);

  // Persist locally; debounce sync to server when logged in
  useEffect(() => {
    if (!localReady || skipSync.current) return;

    writeLocalCart(items);

    if (!user) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void pushToServer(items);
    }, 300);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, localReady, user, pushToServer]);

  function addItem(product: Product, quantity = 1, variant: ProductVariant | null = null) {
    const stock = variant ? variant.stock : product.stock;
    const key = cartItemKey(product.id, variant?.id);

    setItems((prev) => {
      const existing = prev.find(
        (i) => cartItemKey(i.product.id, i.variant?.id) === key
      );

      if (existing) {
        return prev.map((i) =>
          cartItemKey(i.product.id, i.variant?.id) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, stock) }
            : i
        );
      }

      return [
        ...prev,
        {
          product,
          variant: variant || null,
          quantity: Math.min(quantity, stock),
        },
      ];
    });
  }

  function removeItem(productId: string, variantId?: string | null) {
    const key = cartItemKey(productId, variantId);
    setItems((prev) =>
      prev.filter((i) => cartItemKey(i.product.id, i.variant?.id) !== key)
    );
  }

  function updateQuantity(productId: string, quantity: number, variantId?: string | null) {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    const key = cartItemKey(productId, variantId);
    setItems((prev) =>
      prev.map((i) => {
        if (cartItemKey(i.product.id, i.variant?.id) !== key) return i;
        const stock = i.variant ? i.variant.stock : i.product.stock;
        return { ...i, quantity: Math.min(quantity, stock) };
      })
    );
  }

  const clearCart = useCallback(() => {
    skipSync.current = true;
    setItems([]);
    writeLocalCart([]);

    const hasToken =
      typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

    if (!hasToken) {
      clearPendingClear();
      skipSync.current = false;
      return;
    }

    // Logged-in: server may still hold the cart; keep a flag until clear succeeds
    // so hydrate cannot restore items after a race.
    markPendingClear();
    void api
      .clearServerCart()
      .then(() => {
        clearPendingClear();
      })
      .catch((err) => {
        console.error("Failed to clear cart:", err);
      })
      .finally(() => {
        skipSync.current = false;
      });
  }, []);

  const subtotal = items.reduce((sum, item) => {
    return sum + getProductPrice(item.product, item.variant) * item.quantity;
  }, 0);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        count,
        ready: hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
