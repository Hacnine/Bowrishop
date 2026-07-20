export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  googleId?: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color?: string;
  colorHex?: string;
  size?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  images: string[];
  sku?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  images: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  userId?: string;
  category?: Category;
  variants?: ProductVariant[];
  averageRating?: number;
  reviewCount?: number;
  // ─── Pre-order ───────────────────────────────
  isPreOrder: boolean;
  preOrderNote?: string;
  preOrderDate?: string; // ISO string
  // ─── Specifications ──────────────────────────
  specifications?: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  // Nested category fields
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  subCategories?: Category[];
  _count?: { products: number };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'comparePrice' | 'images' | 'stock' | 'isActive' | 'isPreOrder'>;
  variant?: Pick<ProductVariant, 'id' | 'color' | 'colorHex' | 'size' | 'price' | 'comparePrice' | 'stock' | 'images'>;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface VariantSnapshot {
  color?: string;
  colorHex?: string;
  size?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  variantSnapshot?: VariantSnapshot;
  quantity: number;
  price: number;
  isPreOrder?: boolean;
  product?: Pick<Product, 'id' | 'name' | 'images' | 'slug'>;
  variant?: Pick<ProductVariant, 'id' | 'color' | 'colorHex' | 'size'>;
}

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  shippingCharge: number;
  city: string;
  state: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  userId?: string | null;
  guestEmail?: string | null;
  guestName?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  items: OrderItem[];
  user?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}