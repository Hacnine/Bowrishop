import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useGetProductBySlugQuery } from "../features/products/productsApi";
import {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
} from "../features/reviews/reviewsApi";
import { useAddToCartMutation } from "../features/cart/cartApi";
import { useAddToWishlistMutation } from "../features/wishlist/wishlistApi";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { addGuestItem } from "../features/cart/guestCartSlice";
import { Button } from "../components/ui/Button";
import { StarRating } from "../components/ui/StarRating";
import { Skeleton } from "../components/ui/Skeleton";
import { formatCurrency } from "../utils";
import SEO from "../components/SEO";
import type { ProductVariant } from "../types/types.index";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const { data: product, isLoading } = useGetProductBySlugQuery(slug!);
  const { data: reviews } = useGetProductReviewsQuery(product?.id ?? "", {
    skip: !product,
  });
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [createReview, { isLoading: submittingReview }] =
    useCreateReviewMutation();

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Variant selection state
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const hasVariants = !!(product?.variants && product.variants.length > 0);

  // Unique colors across all variants (preserving insertion order)
  const uniqueColors = useMemo<string[]>(() => {
    if (!hasVariants) return [];
    const seen = new Set<string>();
    return product!.variants!
      .map((v) => v.color)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c));
  }, [product, hasVariants]);

  // Auto-select the first color and first size when product data arrives
  useEffect(() => {
    if (!hasVariants || !product?.variants) return;
    const firstColor = uniqueColors[0] ?? null;
    setSelectedColor(firstColor);
    const firstSize =
      product.variants
        .filter((v) => !firstColor || v.color === firstColor)
        .find((v) => !!v.size)?.size ?? null;
    setSelectedSize(firstSize);
    setSelectedImage(0);
  // Re-run only when navigating to a different product
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Sizes available for the currently selected color
  const sizesForColor = useMemo<string[]>(() => {
    if (!hasVariants) return [];
    const seen = new Set<string>();
    return product!.variants!
      .filter((v) => !selectedColor || v.color === selectedColor)
      .map((v) => v.size)
      .filter((s): s is string => !!s && !seen.has(s) && !!seen.add(s));
  }, [product, hasVariants, selectedColor]);

  // The single matching variant (color + size)
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants) return null;
    return (
      product!.variants!.find(
        (v) =>
          (!selectedColor || v.color === selectedColor) &&
          (!selectedSize || v.size === selectedSize)
      ) ?? null
    );
  }, [product, hasVariants, selectedColor, selectedSize]);

  // Color hex for the currently selected color (for the swatch border highlight)
  const colorHexMap = useMemo(() => {
    if (!hasVariants) return {} as Record<string, string>;
    return Object.fromEntries(
      product!.variants!
        .filter((v) => v.color && v.colorHex)
        .map((v) => [v.color!, v.colorHex!])
    );
  }, [product, hasVariants]);

  // Images to display: variant images (if any) → fallback to product images
  const displayImages = useMemo<string[]>(() => {
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    return product?.images ?? [];
  }, [selectedVariant, product]);

  // Price / comparePrice / stock from selected variant (or base product)
  const displayPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product?.price ?? 0);
  const displayComparePrice = selectedVariant
    ? selectedVariant.comparePrice
      ? Number(selectedVariant.comparePrice)
      : undefined
    : product?.comparePrice
    ? Number(product.comparePrice)
    : undefined;
  const displayStock = selectedVariant
    ? selectedVariant.stock
    : product?.stock ?? 0;

  const discountPct =
    displayComparePrice && displayComparePrice > displayPrice
      ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
      : 0;

  // Reset image index when variant (and thus image set) changes
  const handleColorSelect = (color: string) => {
    const next = color === selectedColor ? (uniqueColors[0] ?? null) : color;
    setSelectedColor(next);
    // Auto-select the first size available under the new color
    const firstSize =
      product?.variants
        ?.filter((v) => !next || v.color === next)
        .find((v) => !!v.size)?.size ?? null;
    setSelectedSize(firstSize);
    setSelectedImage(0);
    setQty(1);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size === selectedSize ? null : size);
    setQty(1);
  };

  // ── Cart handler ────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      dispatch(
        addGuestItem({
          productId: product!.id,
          quantity: qty,
          product: {
            id: product!.id,
            name: product!.name,
            slug: product!.slug,
            price: displayPrice,
            comparePrice: displayComparePrice,
            images: displayImages,
            stock: displayStock,
            isActive: product!.isActive,
          },
        })
      );
      toast.success("Added to cart");
      return;
    }
    try {
      await addToCart({
        productId: product!.id,
        quantity: qty,
        ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
      } as any).unwrap();
      toast.success("Added to cart");
    } catch {
      toast.error("Could not add to cart");
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      await addToWishlist(product!.id).unwrap();
      toast.success("Added to wishlist");
    } catch {
      toast.error("Could not add to wishlist");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview({
        productId: product!.id,
        rating: reviewRating,
        comment: reviewComment,
      }).unwrap();
      toast.success("Review submitted");
      setReviewComment("");
      setReviewRating(5);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? "Could not submit review");
    }
  };

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg mb-4">Product not found.</p>
        <Link to="/products">
          <Button variant="outline">Back to products</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${product.name} | Bowri Shop`}
        description={product.description}
        canonical={`https://www.bowrishop.com/product/${product.slug}`}
        image={product?.images[0]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Images ────────────────────────────────────────────────────── */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
              <img
                src={displayImages[selectedImage] ?? "/placeholder.jpg"}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            </div>
            {displayImages.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      i === selectedImage
                        ? "border-indigo-600"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <div>
            {product.category && (
              <Link
                to={`/products?categoryId=${product.category.id}`}
                className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 inline-block"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <StarRating value={product.averageRating ?? 0} readonly size="sm" />
              <span className="text-sm text-gray-500">
                ({product.reviewCount ?? 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(displayPrice)}
              </span>
              {displayComparePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatCurrency(displayComparePrice)}
                  </span>
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

            {/* ── Color selector ──────────────────────────────────────────── */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Color
                  {selectedColor && (
                    <span className="ml-2 font-normal text-gray-500">{selectedColor}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const hex = colorHexMap[color];
                    const active = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => handleColorSelect(color)}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          active
                            ? "border-indigo-600 scale-110 shadow-md"
                            : "border-gray-300 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: hex ?? color }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Size selector ───────────────────────────────────────────── */}
            {sizesForColor.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Size
                  {selectedSize && (
                    <span className="ml-2 font-normal text-gray-500">{selectedSize}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((size) => {
                    // Is this size+color combo actually in stock?
                    const variant = product.variants?.find(
                      (v) =>
                        v.size === size &&
                        (!selectedColor || v.color === selectedColor)
                    );
                    const inStock = (variant?.stock ?? 0) > 0;
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!inStock}
                        onClick={() => handleSizeSelect(size)}
                        className={`px-4 py-2 text-sm rounded-xl border-2 font-medium transition-all ${
                          active
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : inStock
                            ? "border-gray-200 text-gray-700 hover:border-gray-400"
                            : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}



            {/* ── Stock / qty / CTA ────────────────────────────────────────── */}
            {displayStock <= 0 && (selectedVariant !== null || !hasVariants) ? (
              <p className="text-red-500 font-medium mb-4">Out of stock</p>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button
                      className="px-3 py-2 hover:bg-gray-50 text-lg"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                    <button
                      className="px-3 py-2 hover:bg-gray-50 text-lg"
                      onClick={() =>
                        setQty(Math.min(displayStock || 99, qty + 1))
                      }
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">
                    {displayStock > 0 ? `${displayStock} in stock` : ""}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    isLoading={addingCart}
                    className="flex-1"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> Add to cart
                  </Button>
                  <Button variant="outline" onClick={handleAddToWishlist}>
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Reviews ─────────────────────────────────────────────────────────── */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Reviews</h2>
          {reviews && reviews.reviews && reviews.reviews.length > 0 ? (
            <div className="space-y-6 mb-12">
              {reviews.reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.user?.name ?? "Anonymous"}
                      </p>
                      <StarRating value={review.rating} readonly size="sm" className="mt-1" />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-10">No reviews yet. Be the first!</p>
          )}

          {isAuthenticated && user?.id !== product.userId && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Write a review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} size="md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience…"
                  />
                </div>
                <Button type="submit" isLoading={submittingReview}>
                  Submit review
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}