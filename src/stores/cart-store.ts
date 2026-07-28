import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  /**
   * Display price only. The server re-derives the authoritative price from the
   * `products` table at checkout — never trust these values for billing.
   */
  unitPrice: number;
  totalPrice: number;
  /** Gift-card amount id or top-up catalogue id; sent to the server to price the line. */
  variantId?: string | null;
  fields?: Record<string, string>;
}

interface CartState {
  items: CartItem[];

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

/**
 * Compute derived cart values.
 * Use these selectors instead of reading state.itemCount / state.total directly.
 */
export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.totalPrice, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      totalPrice: (i.quantity + item.quantity) * i.unitPrice,
                    }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i,
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "gh-store-cart",
    },
  ),
);
