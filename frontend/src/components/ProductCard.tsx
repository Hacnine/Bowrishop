import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product } from '../types';
import { StarRating } from './ui/StarRating';
import { Button } from './ui/Button';
import { formatCurrency, getDiscountPercent } from '../utils';
import { useAddToCartMutation } from '../features/cart/cartApi';
import { useAddToWishlistMutation } from '../features/wishlist/wishlistApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { addGuestItem } from '../features/cart/guestCartSlice';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(addGuestItem({
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
        },
      }));
      toast.success('Added to cart!');
      return;
    }
    try {
      await addToCart({ productId: product.id, quantity: 1 }).unwrap();
      toast.success('Added to cart!');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
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

  return (
    <Link to={`/products/${product.slug}`} className="group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative overflow-hidden h-56">
          <img
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPercent}%
            </span>
          )}
          {product.stock === 0 && (
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
        <div className="p-4">
          {product.category && (
            <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">{product.category.name}</span>
          )}
          <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 text-sm leading-snug">{product.name}</h3>
          {product.averageRating !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <StarRating value={product.averageRating} readonly size="sm" />
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">{formatCurrency(product.comparePrice)}</span>
            )}
          </div>
          <Button
            className="w-full mt-3"
            size="sm"
            onClick={handleAddToCart}
            isLoading={addingCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
