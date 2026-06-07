"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products as defaultProducts, type Product } from "@/lib/data/products";
import { categories as defaultCategories, type Category } from "@/lib/data/categories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminState {
  // Auth
  adminPassword: string;
  isLoggedIn: boolean;

  // Data
  products: Product[];
  categories: Category[];

  // Auth actions
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;

  // Product CRUD
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Reset to defaults (useful for dev)
  resetToDefaults: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // ---- initial state ----
      adminPassword: "adminpassword123",
      isLoggedIn: false,
      products: defaultProducts,
      categories: defaultCategories,

      // ---- auth ----
      login: (password) => {
        if (password === get().adminPassword) {
          set({ isLoggedIn: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isLoggedIn: false }),

      changePassword: (currentPassword, newPassword) => {
        if (currentPassword !== get().adminPassword) return false;
        if (!newPassword || newPassword.length < 6) return false;
        set({ adminPassword: newPassword });
        return true;
      },

      // ---- products ----
      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      // ---- reset ----
      resetToDefaults: () =>
        set({
          products: defaultProducts,
          categories: defaultCategories,
          adminPassword: "adminpassword123",
        }),
    }),
    {
      name: "crochett-admin-storage",
      // Only persist password; don't persist products/categories in localStorage to avoid QuotaExceededError when uploading images
      partialize: (state) => ({
        adminPassword: state.adminPassword,
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// Public helpers — for use in server/client components that need live products
// ---------------------------------------------------------------------------

/** Call this in client components to get live product list */
export const useLiveProducts = () => useAdminStore((s) => s.products);
export const useLiveCategories = () => useAdminStore((s) => s.categories);
