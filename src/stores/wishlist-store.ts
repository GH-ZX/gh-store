import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  /** Product ids the user has saved. */
  productIds: string[];

  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
}

/**
 * Wishlist — client-side and persisted to localStorage, like the cart.
 *
 * Deliberately stores ids only: names and prices change, and re-reading them
 * from the products query keeps saved items from going stale.
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),

      remove: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),

      clear: () => set({ productIds: [] }),

      has: (productId) => get().productIds.includes(productId),
    }),
    {
      name: "gh-store-wishlist",
    },
  ),
);

/** Selector helper for components that only need the count. */
export function getWishlistCount(productIds: string[]): number {
  return productIds.length;
}
