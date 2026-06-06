"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  items: string[]; // product IDs
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (id) => {
        set((state) => ({
          items: state.items.includes(id)
            ? state.items
            : [...state.items, id],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i !== id),
        }));
      },

      toggleItem: (id) => {
        set((state) => ({
          items: state.items.includes(id)
            ? state.items.filter((i) => i !== id)
            : [...state.items, id],
        }));
      },

      isInWishlist: (id) => {
        return get().items.includes(id);
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "crochett-wishlist",
    }
  )
);
