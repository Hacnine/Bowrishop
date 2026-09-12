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
  // ─── Video ───────────────────────────────────
  videoUrl?: string | null;
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
  product: Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'isActive' | 'isPreOrder'>;
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

export interface WishlistItem {
  id: string;
  productId: string;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'images'> & {
    variants?: Pick<ProductVariant, 'id' | 'price' | 'stock'>[];
  };
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discount: number;
  minOrder: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  response?: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: Array<{ productId: string; _sum: { quantity: number }; product?: Product }>;
  ordersByStatus: Array<{ status: OrderStatus; _count: { id: number } }>;
}

// ─── Variant mutation payloads ─────────────────────────────────────────────────

export interface CreateVariantPayload {
  color?: string;
  colorHex?: string;
  size?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  images?: string[];
  sku?: string;
  isActive?: boolean;
}

export interface UpdateVariantPayload extends Partial<CreateVariantPayload> {}