import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, TrendingDown, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from '../features/wishlist/wishlistApi';
import { useAddToCartMutation } from '../features/cart/cartApi';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils';

function RowSkeleton() {
  return (
    <div className="flex items-center gap-5 p-5 border-b border-gray-100 last:border-0 animate-pulse">
      <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-5 bg-gray-100 rounded w-20 ml-auto" />
        <div className="h-3 bg-gray-100 rounded w-14 ml-auto" />
      </div>
      <div className="w-32 h-9 bg-gray-100 rounded-full flex-shrink-0" />
    </div>
  );
}

export function WishlistPage() {
  const { data: wishlist, isLoading } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [addToCart] = useAddToCartMutation();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

const handleAddToCart = async (productId: string, name: string, price?: number) => {
    setAddingIds((prev) => new Set(prev).add(productId));
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      toast.success(`${name} added to cart`);

      // 👈 মেটা পিক্সেল AddToCart ইভেন্ট ফায়ার করা হলো
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'AddToCart', {
          content_name: name,
          content_ids: [productId],
          content_type: 'product',
          // যদি প্যারামিটার হিসেবে প্রাইস পাস করা থাকে তবে সেটি যাবে, নাহলে ওমিট করবে
          ...(price ? { value: price, currency: 'BDT' } : {})
        });
      }

    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleAddAll = async () => {
    if (!wishlist) return;
    const inStock = wishlist.filter((i) => i.product.stock > 0);
    if (inStock.length === 0) return toast.error('No items in stock');
    await Promise.allSettled(
      inStock.map((i) => addToCart({ productId: i.product.id, quantity: 1 }).unwrap()),
    );
    toast.success(`${inStock.length} item(s) added to cart`);
  };

  const handleRemove = async (productId: string) => {
    setRemovingIds((prev) => new Set(prev).add(productId));
    try {
      await removeFromWishlist(productId).unwrap();
    } catch {
      toast.error('Could not remove');
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  /* ── Empty ── */
  if (!isLoading && (!wishlist || wishlist.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-28 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-9 h-9 text-rose-300" />
        </div>
        <h1 className="font-cormorant text-3xl font-bold text-gray-900 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8">Save products you love and come back to them anytime.</p>
        <Link to="/products">
          <Button className="rounded-full px-8 bg-[#C7927E] hover:bg-[#A97462] text-white">Browse products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            My Wishlist{' '}
            {wishlist && (
              <span className="text-gray-400 font-normal">({wishlist.length})</span>
            )}
          </h3>
        </div>
        {wishlist && wishlist.length > 0 && (
          <button
            type="button"
            onClick={handleAddAll}
            className="flex items-center gap-2 text-sm font-semibold text-[#C7927E] hover:text-[#A97462] transition-colors border border-[#C7927E] hover:border-[#A97462] rounded-full px-4 py-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add all to cart
          </button>
        )}
      </div>

      {/* Main panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {wishlist!.map((item) => {
              const isRemoving = removingIds.has(item.product.id);
              const isAdding = addingIds.has(item.product.id);
              const outOfStock = item.product.stock <= 0;
              const hasDiscount =
                item.product.comparePrice && item.product.comparePrice > item.product.price;
              const discountPct = hasDiscount
                ? Math.round(
                    ((item.product.comparePrice! - item.product.price) /
                      item.product.comparePrice!) *
                      100,
                  )
                : 0;

              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-5 px-5 py-4 transition-all duration-200 hover:bg-gray-50 ${
                    isRemoving ? 'opacity-0 scale-y-95' : 'opacity-100 scale-y-100'
                  }`}
                >
                  {/* Image */}
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                  >
                    <img
                      src={item.product.images[0] ?? '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="font-medium text-gray-800 hover:text-[#C7927E] transition-colors line-clamp-2 leading-snug block"
                    >
                      {item.product.name}
                    </Link>
                    {outOfStock ? (
                      <span className="inline-block mt-2 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        Out of stock
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        In stock
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0 w-32">
                    <p className="text-lg font-bold text-[#C7927E]">
                      {formatCurrency(item.product.price)}
                    </p>
                    {hasDiscount && (
                      <>
                        <p className="text-xs text-gray-400 line-through">
                          {formatCurrency(item.product.comparePrice!)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 mt-0.5">
                          <TrendingDown className="w-3 h-3" />
                          {discountPct}% off
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      disabled={outOfStock || isAdding}
                      isLoading={isAdding}
                      onClick={() => handleAddToCart(item.product.id, item.product.name)}
                      className="rounded-full bg-[#C7927E] hover:bg-[#A97462] text-white disabled:bg-gray-100 disabled:text-gray-400 whitespace-nowrap px-4"
                    >
                      {!isAdding && <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />}
                      {outOfStock ? 'Out of stock' : 'Add to cart'}
                    </Button>
                    <button
                      type="button"
                      title="Remove from wishlist"
                      onClick={() => handleRemove(item.product.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}