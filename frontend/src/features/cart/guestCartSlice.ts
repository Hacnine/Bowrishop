import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface GuestCartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  stock: number;
  isActive: boolean;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  product: GuestCartProduct;
}

interface GuestCartState {
  items: GuestCartItem[];
}

const STORAGE_KEY = 'trendora_guest_cart';

const load = (): GuestCartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const save = (items: GuestCartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
};

const guestCartSlice = createSlice({
  name: 'guestCart',
  initialState: { items: load() } as GuestCartState,
  reducers: {
    addGuestItem(state, action: PayloadAction<GuestCartItem>) {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + action.payload.quantity,
          action.payload.product.stock,
        );
      } else {
        state.items.push(action.payload);
      }
      save(state.items);
    },
    updateGuestItem(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        save(state.items);
      }
    },
    removeGuestItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
      save(state.items);
    },
    clearGuestCart(state) {
      state.items = [];
      save(state.items);
    },
  },
});

export const { addGuestItem, updateGuestItem, removeGuestItem, clearGuestCart } =
  guestCartSlice.actions;
export default guestCartSlice.reducer;
