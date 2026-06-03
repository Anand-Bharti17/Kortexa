import { create } from "zustand";
import api from "../services/api";

const useWishlistStore = create((set, get) => ({
  wishlistIds: [],
  loaded: false,

  fetchWishlistIds: async () => {
    try {
      const { data } = await api.get("/wishlist/ids");
      set({ wishlistIds: data || [], loaded: true });
    } catch {
      set({ wishlistIds: [], loaded: true });
    }
  },

  isWishlisted: (productId) => get().wishlistIds.includes(productId),

  toggleWishlist: async (productId) => {
    const isOn = get().wishlistIds.includes(productId);
    if (isOn) {
      await api.delete(`/wishlist/${productId}`);
      set({
        wishlistIds: get().wishlistIds.filter((id) => id !== productId),
      });
      return false;
    }
    await api.post(`/wishlist/${productId}`);
    set({ wishlistIds: [...get().wishlistIds, productId] });
    return true;
  },

  clearWishlist: () => set({ wishlistIds: [], loaded: false }),
}));

export default useWishlistStore;
