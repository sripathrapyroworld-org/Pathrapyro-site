"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { CartLine } from "@/lib/utils";
import { cartTotals } from "@/lib/utils";
import { cartQuoteKeyFromLines } from "@/lib/cart-quote";
import { requireCustomerLogin } from "@/components/login-gate";

const STORAGE = "pathra-cart-v1";

function persistCart(items: CartLine[]) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
}

function mergeCartLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const src of [a, b]) {
    for (const line of src) {
      const prev = map.get(line.key);
      if (!prev || line.qty > prev.qty) map.set(line.key, line);
    }
  }
  return Array.from(map.values());
}

type CartContextValue = {
  items: CartLine[];
  count: number;
  totals: ReturnType<typeof cartTotals>;
  loggedIn: boolean;
  sessionPending: boolean;
  quoteReady: boolean;
  whatsapp: string;
  gstPercent: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  upsert: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  requireLogin: (action?: () => void) => boolean;
  toast: string;
  showToast: (msg: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  userId,
  gstPercent = 0,
  quoteReady = false,
  quoteCartKey = "",
  customerPackingCharge = 0,
  customerShippingCharge = 0,
  whatsapp = "",
}: {
  children: React.ReactNode;
  userId?: string | null;
  gstPercent?: number;
  quoteReady?: boolean;
  quoteCartKey?: string;
  customerPackingCharge?: number;
  customerShippingCharge?: number;
  whatsapp?: string;
}) {
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.role === "CUSTOMER" ? session.user.id : null;
  const resolvedUserId = sessionUserId || userId || null;
  const loggedIn = Boolean(resolvedUserId);
  const sessionPending = status === "loading" && !loggedIn;

  const [items, setItems] = useState<CartLine[]>([]);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(!resolvedUserId);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistCart(items);
  }, [items, ready]);

  useEffect(() => {
    if (!ready || status === "loading") return;
    if (!resolvedUserId) {
      setSynced(true);
      return;
    }
    let cancelled = false;
    setSynced(false);
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const remote = Array.isArray(data.items) ? (data.items as CartLine[]) : [];
        setItems((local) => {
          const merged = mergeCartLines(local, remote);
          persistCart(merged);
          return merged;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSynced(true);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedUserId, ready, status]);

  useEffect(() => {
    if (!resolvedUserId || !ready || !synced || status === "loading") return;
    fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => {});
  }, [items, resolvedUserId, ready, synced, status]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const requireLogin = useCallback(
    (action?: () => void) => requireCustomerLogin(loggedIn, action, sessionPending),
    [loggedIn, sessionPending]
  );

  /** Guest-friendly: always saves to local cart (no login required). */
  const add = useCallback(
    (line: Omit<CartLine, "qty">, qty = 1) => {
      const q = Math.max(1, qty);
      setItems((prev) => {
        const found = prev.find((i) => i.key === line.key);
        const next = found
          ? prev.map((i) => (i.key === line.key ? { ...i, qty: i.qty + q } : i))
          : [...prev, { ...line, qty: q }];
        persistCart(next);
        return next;
      });
      showToast(`✅ ${line.name} added to cart`);
    },
    [showToast]
  );

  /** Set absolute qty for a line (used by shop Order Now). Persists immediately. */
  const upsert = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    const q = Math.max(1, qty);
    setItems((prev) => {
      const found = prev.find((i) => i.key === line.key);
      const next = found
        ? prev.map((i) => (i.key === line.key ? { ...line, qty: q } : i))
        : [...prev, { ...line, qty: q }];
      persistCart(next);
      return next;
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => {
      const next =
        qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i));
      persistCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== key);
      persistCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persistCart([]);
    setItems([]);
  }, []);

  const cartKey = useMemo(() => cartQuoteKeyFromLines(items), [items]);
  const quoteApplies = useMemo(
    () => Boolean(quoteReady && quoteCartKey && cartKey && quoteCartKey === cartKey),
    [quoteReady, quoteCartKey, cartKey]
  );

  const totals = useMemo(
    () =>
      cartTotals(items, {
        gstPercent,
        feesPending: false,
        packingCharge: 0,
        shippingCharge: 0,
      }),
    [items, gstPercent]
  );
  const count = totals.count;

  const value = useMemo(
    () => ({
      items,
      count,
      totals,
      loggedIn,
      sessionPending,
      quoteReady: quoteApplies,
      whatsapp,
      gstPercent,
      add,
      upsert,
      setQty,
      remove,
      clear,
      requireLogin,
      toast,
      showToast,
    }),
    [
      items,
      count,
      totals,
      loggedIn,
      sessionPending,
      quoteApplies,
      whatsapp,
      gstPercent,
      add,
      upsert,
      setQty,
      remove,
      clear,
      requireLogin,
      toast,
      showToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
