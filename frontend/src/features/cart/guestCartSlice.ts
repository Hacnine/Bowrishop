import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface GuestCartProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  isActive: boolean;
  isPreOrder: boolean;
}

export interface GuestCartVariant {
  id: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  price: number;
  comparePrice?: number | null;
  stock: number;
  images: string[];
  sku?: string | null;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  product: GuestCartProduct;
  variant?: GuestCartVariant | null; 
  isPreOrder?: boolean;
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
      const existing = state.items.find(
        (i) => 
          i.productId === action.payload.productId && 
          i.variant?.id === action.payload.variant?.id
      );

      const maxStock = action.payload.variant?.stock ?? 0;

      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + action.payload.quantity,
          maxStock,
        );
      } else {
        state.items.push(action.payload);
      }
      save(state.items);
    },
    updateGuestItem(state, action: PayloadAction<{ productId: string; variantId?: string | null; quantity: number }>) {
      const item = state.items.find(
        (i) => 
          i.productId === action.payload.productId && 
          i.variant?.id === action.payload.variantId
      );
      if (item) {
        item.quantity = action.payload.quantity;
        save(state.items);
      }
    },
    removeGuestItem(state, action: PayloadAction<{ productId: string; variantId?: string | null }>) {
      state.items = state.items.filter(
        (i) => 
          !(i.productId === action.payload.productId && i.variant?.id === action.payload.variantId)
      );
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
