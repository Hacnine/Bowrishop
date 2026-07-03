import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from '../features/wishlist/wishlistApi';
import { useAddToCartMutation } from '../features/cart/cartApi';
import { Button } from '../components/ui/Button';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils';

export function WishlistPage() {
  const { data: wishlist, isLoading } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [addToCart] = useAddToCartMutation();

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      toast.success('Added to cart');
    } catch {
      toast.error('Could not add to cart');
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId).unwrap();
    } catch {
      toast.error('Could not remove');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save products you love to find them later.</p>
        <Link to="/products"><Button>Browse products</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Wishlist ({wishlist.length})</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group">
            <Link to={`/products/${item.product.slug}`} className="block relative">
              <img
                src={item.product.images[0] ?? '/placeholder.jpg'}
                alt={item.product.name}
                className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <div className="p-4">
              <Link to={`/products/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2 block mb-2">
                {item.product.name}
              </Link>
              <p className="text-indigo-600 font-bold mb-4">{formatCurrency(item.product.price)}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={item.product.stock <= 0}
                  onClick={() => handleAddToCart(item.product.id)}
                >
                  {item.product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRemove(item.product.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
