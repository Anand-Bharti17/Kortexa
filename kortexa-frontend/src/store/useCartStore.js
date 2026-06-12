import { create } from "zustand";
import { persist } from "zustand/middleware"; // <-- Add this import

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      addToCart: (product, quantity = 1) => {
        const currentItems = get().cartItems;
        const lineKey = product.variantId
          ? `${product.id}-${product.variantId}`
          : String(product.id);
        const existingItem = currentItems.find(
          (item) =>
            (item.variantId
              ? `${item.id}-${item.variantId}`
              : String(item.id)) === lineKey,
        );

        if (existingItem) {
          set({
            cartItems: currentItems.map((item) => {
              const key = item.variantId
                ? `${item.id}-${item.variantId}`
                : String(item.id);
              return key === lineKey
                ? { ...item, quantity: item.quantity + parseInt(quantity, 10) }
                : item;
            }),
          });
        } else {
          set({
            cartItems: [
              ...currentItems,
              { ...product, quantity: parseInt(quantity, 10) },
            ],
          });
        }
      },

      removeFromCart: (productId) => {
        set({
          cartItems: get().cartItems.filter((item) => item.id !== productId),
        });
      },

      clearCart: () => set({ cartItems: [] }),
      getTotalItems: () =>
        get().cartItems.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () =>
        get().cartItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),
    }),
    {
      name: "kortexa-cart-storage", // <-- The unique name for Local Storage
    },
  ),
);

export default useCartStore;
