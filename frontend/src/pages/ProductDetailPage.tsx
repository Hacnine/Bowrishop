import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, ChevronLeft, Minus, Plus } from "lucide-react";
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
    return product!
      .variants!.map((v) => v.color)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c));
  }, [product, hasVariants]);

  // Unique sizes across all variants (preserving insertion order)
  const uniqueSizes = useMemo<string[]>(() => {
    if (!hasVariants) return [];
    const seen = new Set<string>();
    return product!
      .variants!.map((v) => v.size)
      .filter((s): s is string => !!s && !seen.has(s) && !!seen.add(s));
  }, [product, hasVariants]);

  // ── Images to display (All main + variant images) ───────────────────────
  const allProductImages = useMemo<string[]>(() => {
    if (!product) return [];
    const uniqueImages = new Set([
      ...(product.images ?? []),
      ...(product.variants?.flatMap((v) => v.images ?? []) ?? []),
    ]);
    return Array.from(uniqueImages);
  }, [product]);

  // Initial setup: find first variant and set initial selected color/size/image
  useEffect(() => {
    if (!product || !hasVariants || selectedColor || selectedSize) return;

    const firstVariant = product.variants![0];
    if (firstVariant) {
      setSelectedColor(firstVariant.color ?? null);
      setSelectedSize(firstVariant.size ?? null);

      // Try to find the image index that corresponds to the first variant
      if (firstVariant.images && firstVariant.images.length > 0) {
        const imageIndex = allProductImages.indexOf(firstVariant.images[0]);
        if (imageIndex !== -1) {
          setSelectedImage(imageIndex);
        }
      }
    }
  }, [product, hasVariants, selectedColor, selectedSize, allProductImages]);

  // Handles clicking on a thumbnail image
// Handles clicking on a thumbnail image
  const handleThumbnailClick = (img: string, index: number) => {
    // 1. ALWAYS update the selected image index regardless of variants
    setSelectedImage(index);

    // 2. If the product has variants, try to auto-select the matching variant
    if (hasVariants) {
      // Look for a variant that uses this image
      const matchingVariant = product!.variants!.find((v) =>
        v.images?.includes(img),
      );
      
      if (matchingVariant) {
        // If current selections don't match this variant, update them
        if (selectedColor !== matchingVariant.color) {
          setSelectedColor(matchingVariant.color ?? null);
        }
        if (selectedSize !== matchingVariant.size) {
          setSelectedSize(matchingVariant.size ?? null);
        }
        setQty(1); // Reset quantity on variant change
      }
    }
  };

  // Handles selecting a color (only allowed if it belongs to a valid variant)
  const handleColorSelect = (color: string) => {
    const nextColor = color === selectedColor ? null : color;
    setSelectedColor(nextColor);

    // If size was already selected, check if this new color-size combo exists
    if (selectedSize) {
      const isValidCombo = product?.variants?.some(
        (v) => v.color === nextColor && v.size === selectedSize,
      );
      if (!isValidCombo) {
        setSelectedSize(null); // Clear invalid size selection
      }
    }
    setQty(1);
  };

  // Handles selecting a size (only allowed if it belongs to a valid variant)
  const handleSizeSelect = (size: string) => {
    const nextSize = size === selectedSize ? null : size;
    setSelectedSize(nextSize);

    // If color was already selected, check if this new color-size combo exists
    if (selectedColor) {
      const isValidCombo = product?.variants?.some(
        (v) => v.color === selectedColor && v.size === nextSize,
      );
      if (!isValidCombo) {
        setSelectedColor(null); // Clear invalid color selection
      }
    }
    setQty(1);
  };

  // The single matching variant (color + size must match)
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants) return null;
    return (
      product!.variants!.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      ) ?? null
    );
  }, [product, hasVariants, selectedColor, selectedSize]);

  // Color hex mapping for unique colors
  const colorHexMap = useMemo(() => {
    if (!hasVariants) return {} as Record<string, string>;
    return Object.fromEntries(
      product!
        .variants!.filter((v) => v.color && v.colorHex)
        .map((v) => [v.color!, v.colorHex!]),
    );
  }, [product, hasVariants]);

  // Price / comparePrice / stock / image from selected variant (or base product fallback)
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
    : (product?.stock ?? 0);
  const mainImage = allProductImages[selectedImage] ?? "/placeholder.jpg";

  const discountPct =
    displayComparePrice && displayComparePrice > displayPrice
      ? Math.round(
          ((displayComparePrice - displayPrice) / displayComparePrice) * 100,
        )
      : 0;

  // Update selected main image when variant changes (if needed)
  // Instantly push the big image to match the variant image on change
  useEffect(() => {
    if (selectedVariant?.images?.[0]) {
      const imageIndex = allProductImages.indexOf(selectedVariant.images[0]);
      if (imageIndex !== -1) {
        setSelectedImage(imageIndex);
      }
    }
  }, [selectedVariant, allProductImages]);

  // ── Cart / Wishlist / Review Handlers ───────────────────────────────
 const handleAddToCart = async () => {
    // 1. Guard clause: If there are variants, require selection
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a color and size first");
      return;
    }

    // 2. Handle GUEST Cart (Not Authenticated)
    if (!isAuthenticated) {
      dispatch(
        addGuestItem({
          productId: product.id,
          quantity: qty, // 👈 Use the active quantity state here too!
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            comparePrice: product.comparePrice
              ? Number(product.comparePrice)
              : undefined,
            images: product.images,
            stock: product.stock,
            isActive: product.isActive,
          },
          // 👈 FIX: Send the actively selected variant instead of the first index
          variant: hasVariants ? selectedVariant : null,
        }),
      );
      toast.success("Added to cart");
      return;
    }

    // 3. Handle AUTHENTICATED Cart (User Logged In)
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
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
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

  function DescriptionRenderer({ text }: { text: string }) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return (
      <div className="space-y-2 text-gray-600 leading-relaxed text-sm">
        {lines.map((line, i) => {
          const isHeader = line.endsWith(":") && !line.startsWith("✅");
          const isCheck = line.startsWith("✅");

          if (isHeader) {
            return (
              <p key={i} className="font-semibold text-gray-800 mt-4 mb-1">
                {line}
              </p>
            );
          }

          if (isCheck) {
            const [label, ...rest] = line.replace("✅", "").trim().split(" – ");
            const detail = rest.join(" – ");
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5 shrink-0">✅</span>
                <p>
                  <span className="font-medium text-gray-800">{label}</span>
                  {detail && <span className="text-gray-500"> – {detail}</span>}
                </p>
              </div>
            );
          }

          return <p key={i}>{line}</p>;
        })}
      </div>
    );
  }

  // ── Loading / not found states ──────────────────────────────────────────
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
        image={allProductImages[0]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Images Section ──────────────────────────── */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3 relative">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            </div>
            {allProductImages.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {allProductImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => handleThumbnailClick(img, i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      i === selectedImage
                        ? "border-indigo-600"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details Section ───────────────────────────────────────────── */}
          <div>
            {product.category && (
              <Link
                to={`/products?categoryId=${product.category.id}`}
                className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 inline-block"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <StarRating
                value={product.averageRating ?? 0}
                readonly
                size="sm"
              />
              <span className="text-sm text-gray-500">
                ({product.reviewCount ?? 0} reviews)
              </span>
            </div>

            {/* Price section */}
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

            <div className="mb-6">
              <DescriptionRenderer text={product.description} />
            </div>

            {/* ── Variant Selectors ──────────────────────────────────────────── */}
            {hasVariants && (
              <>
                {/* Color Selector */}
                {uniqueColors.length > 0 && (
                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Color
                      {selectedColor && (
                        <span className="ml-2 font-normal text-gray-500">
                          {selectedColor}
                        </span>
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

                {/* Size Selector */}
                {uniqueSizes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Size
                      {selectedSize && (
                        <span className="ml-2 font-normal text-gray-500">
                          {selectedSize}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map((size) => {
                        const active = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleSizeSelect(size)}
                            className={`px-4 py-2 text-sm rounded-xl border-2 font-medium transition-all ${
                              active
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Stock / qty / CTA section ─────────────────────────────── */}
            {hasVariants && (selectedVariant ? displayStock <= 0 : false) ? (
              <p className="text-red-500 font-medium mb-4">Out of stock</p>
            ) : !hasVariants && product.stock <= 0 ? (
              <p className="text-red-500 font-medium mb-4">Out of stock</p>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <label className="text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                    <button
                      className="px-3 py-2 hover:bg-gray-50 text-lg flex items-center justify-center"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                    <button
                      className="px-3 py-2 hover:bg-gray-50 text-lg flex items-center justify-center"
                      onClick={() =>
                        setQty(Math.min(displayStock || 99, qty + 1))
                      }
                    >
                      <Plus className="w-4 h-4" />
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

        {/* ── Reviews section ────────────────────────────────────────────────── */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Reviews</h2>
          {reviews && reviews.reviews && reviews.reviews.length > 0 ? (
            <div className="space-y-6 mb-12">
              {reviews.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-gray-100 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.user?.name ?? "Anonymous"}
                      </p>
                      <StarRating
                        value={review.rating}
                        readonly
                        size="sm"
                        className="mt-1"
                      />
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
              <h3 className="font-semibold text-gray-900 mb-4">
                Write a review
              </h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <StarRating
                    value={reviewRating}
                    onChange={setReviewRating}
                    size="md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
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
