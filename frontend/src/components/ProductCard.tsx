import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product } from '../types/types.index';
import { StarRating } from './ui/StarRating';
import { Button } from './ui/button';
import { formatCurrency, getDiscountPercent } from '../utils';
import { useAddToCartMutation } from '../features/cart/cartApi';
import { useAddToWishlistMutation } from '../features/wishlist/wishlistApi';
import { useAuth } from '../hooks/useAuth';
import { useAppDispatch } from '../app/hooks';
import { addGuestItem } from '../features/cart/guestCartSlice';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    const defaultVariant =
      product.variants && product.variants.length > 0
        ? (product.variants.find((v) => v.stock > 0) ?? product.variants[0])
        : null;

    const firePixelAddToCart = () => {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_name: product.name,
          content_ids: [product.id.toString()],
          content_type: 'product',
          value: Number(defaultVariant?.price ?? product.price),
          currency: 'BDT',
        });
      }
    };

    if (!isAuthenticated) {
      dispatch(
        addGuestItem({
          productId: product.id,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            comparePrice: product.comparePrice,
            images: product.images,
            stock: product.stock,
            isActive: product.isActive,
            isPreOrder: product.isPreOrder,
          },
          variant: defaultVariant,
        }),
      );
      toast.success(product.isPreOrder ? 'Pre-order added to cart!' : 'Added to cart!');
      firePixelAddToCart();
      return;
    }
    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
        ...(defaultVariant ? { variantId: defaultVariant.id } : {}),
      } as any).unwrap();
      toast.success(product.isPreOrder ? 'Pre-order added to cart!' : 'Added to cart!');
      firePixelAddToCart();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    try {
      await addToWishlist(product.id).unwrap();
      toast.success('Added to wishlist!');
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } };
      if (e?.status === 409) toast.error('Already in wishlist');
      else toast.error('Failed to add to wishlist');
    }
  };

  const discountPercent = product.comparePrice
    ? getDiscountPercent(product.price, product.comparePrice)
    : 0;

  const isOutOfStock = !product.isPreOrder && product.stock === 0;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative overflow-hidden h-56">
          <img
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-150"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            />
          )}

          {/* Badges — pre-order takes priority over sale */}
          {product.isPreOrder ? (
            <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pre-order
            </span>
          ) : discountPercent > 0 ? (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          ) : null}

          {/* Out of stock overlay — pre-order products এ দেখাবে না */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-800 font-semibold px-3 py-1 rounded text-sm">Out of Stock</span>
            </div>
          )}

          <button
            onClick={handleAddToWishlist}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
            aria-label="Add to wishlist"
          >
            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>

        <div className="p-4 flex flex-col" style={{ minHeight: '160px' }}>
          {product.category && (
            <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
              {product.category.name}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 mt-1 text-sm leading-snug line-clamp-1">            {product.name}
          </h3>
          {product.averageRating !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <StarRating value={product.averageRating} readonly size="sm" />
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          )}

          {product.isPreOrder && product.preOrderNote && (
            <p className="text-xs text-amber-600 mt-1 line-clamp-1">{product.preOrderNote}</p>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
            )}
          </div>

          <Button
            className={`w-full mt-3 ${product.isPreOrder ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}`}
            size="sm"
            onClick={handleAddToCart}
            isLoading={addingCart}
            disabled={isOutOfStock}
          >
            {product.isPreOrder ? (
              <><Clock className="w-4 h-4" /> Pre-order Now</>
            ) : (
              <><ShoppingCart className="w-4 h-4" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</>
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
}
