'use client';

import { useState, useMemo, useEffect } from "react";
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Heart, ChevronLeft, Minus, Plus, Clock } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
} from "@/features/reviews/reviewsApi";
import { useAddToCartMutation } from "@/features/cart/cartApi";
import { useAddToWishlistMutation } from "@/features/wishlist/wishlistApi";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { addGuestItem } from "@/features/cart/guestCartSlice";
import { StarRating } from "@/components/ui/StarRating";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/utils";
import { ProductCard } from "@/components/ProductCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import {
  useGetProductBySlugQuery,
  useGetProductsQuery,
} from "@/features/products/productsApi";
import type { Product, ProductVariant } from "@/types/types.index";
import { Button } from "@/components/ui/button";

export function ProductDetailPage({ initialProduct }: { initialProduct?: Product }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  // ── URL search params for color/size ──────────────────────────────────
  const searchParams = useSearchParams();
  const urlColor = searchParams.get("color");
  const urlSize = searchParams.get("size");

  const { data: fetchedProduct, isLoading: isProductLoading } = useGetProductBySlugQuery(slug!, {
    skip: !!initialProduct,
  });
  const product = initialProduct ?? fetchedProduct;
  const isLoading = isProductLoading && !initialProduct;
  const { data: reviews } = useGetProductReviewsQuery(product?.id ?? "", {
    skip: !product,
  });
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [createReview, { isLoading: submittingReview }] =
    useCreateReviewMutation();

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(true); // video আছে থাকলে default এ video দেখাবে
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Variant selection — driven by URL params
  const [selectedColor, setSelectedColor] = useState<string | null>(urlColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(urlSize);

  const hasVariants = !!(product?.variants && product.variants.length > 0);

  const uniqueColors = useMemo<string[]>(() => {
    if (!hasVariants) return [];
    const seen = new Set<string>();
    return product!
      .variants!.map((v) => v.color)
      .filter((c): c is string => !!c && !seen.has(c) && !!seen.add(c));
  }, [product, hasVariants]);

  const uniqueSizes = useMemo<string[]>(() => {
    if (!hasVariants) return [];
    const seen = new Set<string>();
    return product!
      .variants!.map((v) => v.size)
      .filter((s): s is string => !!s && !seen.has(s) && !!seen.add(s));
  }, [product, hasVariants]);

  const allProductImages = useMemo<string[]>(() => {
    if (!product) return [];
    const uniqueImages = new Set([
      ...(product.images ?? []),
      ...(product.variants?.flatMap((v) => v.images ?? []) ?? []),
    ]);
    return Array.from(uniqueImages);
  }, [product]);

  // ── Push color/size to URL ─────────────────────────────────────────────
  const updateUrl = (color: string | null, size: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (color) next.set('color', color);
    else next.delete('color');
    if (size) next.set('size', size);
    else next.delete('size');
    const query = next.toString();
    router.replace(query ? `?${query}` : window.location.pathname);
  };

  // Initial setup: URL params থাকলে সেটা use করো, নইলে first variant
  useEffect(() => {
    if (!product || !hasVariants) return;

    const variants = product.variants!;

    // URL তে color/size দেওয়া আছে এবং valid কিনা check করো
    if (urlColor || urlSize) {
      const match = variants.find(
        (v) =>
          (!urlColor || v.color === urlColor) &&
          (!urlSize || v.size === urlSize),
      );
      if (match) {
        setSelectedColor(match.color ?? null);
        setSelectedSize(match.size ?? null);
        if (match.images?.[0]) {
          const idx = allProductImages.indexOf(match.images[0]);
          if (idx !== -1) setSelectedImage(idx);
        }
        return;
      }
    }

    // URL params নেই বা invalid — first variant দিয়ে শুরু করো
    const first = variants[0];
    if (first) {
      setSelectedColor(first.color ?? null);
      setSelectedSize(first.size ?? null);
      updateUrl(first.color ?? null, first.size ?? null);
      if (first.images?.[0]) {
        const idx = allProductImages.indexOf(first.images[0]);
        if (idx !== -1) setSelectedImage(idx);
      }
    }
  }, [product, hasVariants, allProductImages]);

  const handleThumbnailClick = (img: string, index: number) => {
    setSelectedImage(index);
    if (hasVariants) {
      const matchingVariant = product!.variants!.find((v) =>
        v.images?.includes(img),
      );
      if (matchingVariant) {
        setSelectedColor(matchingVariant.color ?? null);
        setSelectedSize(matchingVariant.size ?? null);
        updateUrl(matchingVariant.color ?? null, matchingVariant.size ?? null);
        setQty(1);
      }
    }
  };

  const handleColorSelect = (color: string) => {
    if (color === selectedColor) return;
    const variantsForColor =
      product?.variants?.filter((v) => v.color === color) ?? [];
    const stillValid = variantsForColor.some((v) => v.size === selectedSize);
    const nextSize = stillValid
      ? selectedSize
      : (variantsForColor[0]?.size ?? null);
    setSelectedColor(color);
    setSelectedSize(nextSize);
    updateUrl(color, nextSize);
    setQty(1);
  };

  const handleSizeSelect = (size: string) => {
    if (size === selectedSize) return;
    const variantsForSize =
      product?.variants?.filter((v) => v.size === size) ?? [];
    const stillValid = variantsForSize.some((v) => v.color === selectedColor);
    const nextColor = stillValid
      ? selectedColor
      : (variantsForSize[0]?.color ?? null);
    setSelectedSize(size);
    setSelectedColor(nextColor);
    updateUrl(nextColor, size);
    setQty(1);
  };

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants) return null;
    return (
      product!.variants!.find(
        (v) => v.color === selectedColor && v.size === selectedSize,
      ) ?? null
    );
  }, [product, hasVariants, selectedColor, selectedSize]);

  const colorHexMap = useMemo(() => {
    if (!hasVariants) return {} as Record<string, string>;
    return Object.fromEntries(
      product!
        .variants!.filter((v) => v.color && v.colorHex)
        .map((v) => [v.color!, v.colorHex!]),
    );
  }, [product, hasVariants]);

  const effectiveVariant = selectedVariant ?? product?.variants?.[0];
  const displayPrice = Number(effectiveVariant?.price ?? 0);
  const displayComparePrice = effectiveVariant?.comparePrice
    ? Number(effectiveVariant.comparePrice)
    : undefined;
  const displayStock = effectiveVariant?.stock ?? 0;
  const mainImage = allProductImages[selectedImage] ?? "/placeholder.jpg";

  const discountPct =
    displayComparePrice && displayComparePrice > displayPrice
      ? Math.round(
          ((displayComparePrice - displayPrice) / displayComparePrice) * 100,
        )
      : 0;

  useEffect(() => {
    if (selectedVariant?.images?.[0]) {
      const imageIndex = allProductImages.indexOf(selectedVariant.images[0]);
      if (imageIndex !== -1) {
        setSelectedImage(imageIndex);
      }
    }
  }, [selectedVariant, allProductImages]);

  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a color and size first");
      return;
    }

    const firePixelAddToCart = () => {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "AddToCart", {
          content_name: product!.name,
          content_ids: [product!.id.toString()],
          content_type: "product",
          value: displayPrice * qty,
          currency: "৳",
        });
      }
    };

    if (!isAuthenticated) {
      dispatch(
        addGuestItem({
          productId: product!.id,
          quantity: qty,
          product: {
            id: product!.id,
            name: product!.name,
            slug: product!.slug,
            isPreOrder: product!.isPreOrder,
            images: product!.images,
            isActive: product!.isActive,
          },
          variant: hasVariants ? selectedVariant : null,
        }),
      );
      toast.success("Added to cart");
      firePixelAddToCart();
      return;
    }

    try {
      await addToCart({
        productId: product!.id,
        quantity: qty,
        ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
      } as any).unwrap();
      toast.success("Added to cart");
      firePixelAddToCart();
    } catch {
      toast.error("Could not add to cart");
    }
  };

  const handleOrderNow = async () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select a color and size first");
      return;
    }

    if (!isAuthenticated) {
      dispatch(
        addGuestItem({
          productId: product!.id,
          quantity: qty,
          product: {
            id: product!.id,
            name: product!.name,
            slug: product!.slug,
            isPreOrder: product!.isPreOrder,
            images: product!.images,
            isActive: product!.isActive,
          },
          variant: hasVariants ? selectedVariant : null,
        }),
      );
      router.push('/checkout');
      return;
    }

    try {
      await addToCart({
        productId: product!.id,
        quantity: qty,
        ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
      }).unwrap();
      router.push('/checkout');
    } catch {
      toast.error("Could not start checkout");
    }
  };

  const { data: relatedData, isLoading: relatedLoading } = useGetProductsQuery(
    { categoryId: product?.category?.id, limit: 8 },
    { skip: !product?.category?.id },
  );

  const relatedProducts = useMemo(() => {
    if (!relatedData?.data || !product) return [];
    return relatedData.data.filter((p) => p.id !== product.id).slice(0, 4);
  }, [relatedData, product]);

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
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
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    return (
      <div className="space-y-2 text-gray-600 leading-relaxed text-sm">
        {lines.map((line, i) => {
          const isHeader = line.endsWith(":") && !line.startsWith("✅");
          const isCheck = line.startsWith("✅");
          if (isHeader) {
            return <p key={i} className="font-semibold text-gray-800 mt-4 mb-1">{line}</p>;
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
        <Link href="/products"><Button variant="outline">Back to products</Button></Link>
      </div>
    );
  }

  const isOutOfStock = !product.isPreOrder && displayStock <= 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8"
        >
          <ChevronLeft className="w-4 h-4" /> Back to products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Images + Video ── */}
          <div>
            {/* Main display area */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3 relative">
              {product.videoUrl && showVideo ? (
                /* Video player */
                <VideoPlayer url={product.videoUrl} />
              ) : (
                /* Image */
                <>
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-110"
                  />
                  {product.isPreOrder && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Pre-order
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Thumbnails — video thumbnail + images */}
            <div className="flex gap-2 flex-wrap">
              {/* Video thumbnail — প্রথমে */}
              {product.videoUrl && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors relative flex items-center justify-center bg-gray-900 shrink-0 ${
                    showVideo ? "border-indigo-600" : "border-transparent hover:border-gray-300"
                  }`}
                  title="Watch video"
                >
                  {/* YouTube thumbnail or play icon */}
                  {product.videoUrl.includes("youtube") || product.videoUrl.includes("youtu.be") ? (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${product.videoUrl.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)?.[1]}/mqdefault.jpg`}
                        alt="Video"
                        className="w-full h-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span className="text-white text-[9px] font-medium">Video</span>
                    </div>
                  )}
                </button>
              )}

              {/* Image thumbnails */}
              {allProductImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { handleThumbnailClick(img, i); setShowVideo(false); }}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    !showVideo && i === selectedImage
                      ? "border-indigo-600"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── Details ── */}
          <div>
            {product.category && (
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2 inline-block"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <StarRating value={product.averageRating ?? 0} readonly size="sm" />
              <span className="text-sm text-gray-500">({product.reviewCount ?? 0} reviews)</span>
            </div>

            {/* Pre-order notice */}
            {product.isPreOrder && (
              <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Pre-order item</p>
                  {product.preOrderNote && (
                    <p className="text-xs text-amber-700 mt-0.5">{product.preOrderNote}</p>
                  )}
                  {product.preOrderDate && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Expected:{" "}
                      {new Date(product.preOrderDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">
                Regular Price:{" "}
                <span className="text-3xl font-bold text-gray-900 align-middle">
                  {formatCurrency(displayPrice)}
                </span>
              </p>
              {displayComparePrice && displayComparePrice > displayPrice && (
                <>
                  <p className="text-lg text-gray-400 line-through">{formatCurrency(displayComparePrice)}</p>
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    You are saving {formatCurrency(displayComparePrice - displayPrice)}
                  </p>
                </>
              )}
            </div>

            <div className="mb-6">
              <DescriptionRenderer text={product.description} />
            </div>

            {/* ── Variant Selectors — Size আগে, তারপর filtered colors ── */}
            {hasVariants && (
              <>
                {/* Size selector */}
                {uniqueSizes.length > 0 && (
                  <div className="mb-5">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Size
                      {selectedSize && <span className="ml-1.5 font-normal text-gray-500">{selectedSize}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map((size) => {
                        const active = selectedSize === size;
                        const hasStock = product!.variants!.some((v) => v.size === size && v.stock > 0);
                        return (
                          <button
                            key={size} type="button"
                            onClick={() => handleSizeSelect(size)}
                            className={`relative px-4 py-2 text-sm rounded-xl border-2 font-medium transition-all ${
                              active
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : hasStock || product!.isPreOrder
                                  ? "border-gray-200 text-gray-700 hover:border-gray-400"
                                  : "border-gray-100 text-gray-300"
                            }`}
                          >
                            {size}
                            {!hasStock && !product!.isPreOrder && (
                              <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                                <span className="absolute top-1/2 left-0 right-0 h-px bg-gray-300 -rotate-12" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color selector — selected size এ available colors দেখাবে */}
                {uniqueColors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Color
                      {selectedColor && <span className="ml-1.5 font-normal text-gray-500">{selectedColor}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map((color) => {
                        const hex = colorHexMap[color];
                        const active = selectedColor === color;
                        const isAvailable = selectedSize
                          ? product!.variants!.some((v) => v.color === color && v.size === selectedSize)
                          : true;
                        const hasStock = selectedSize
                          ? product!.variants!.some((v) => v.color === color && v.size === selectedSize && v.stock > 0)
                          : product!.variants!.some((v) => v.color === color && v.stock > 0);
                        return (
                          <button
                            key={color} type="button" title={color}
                            onClick={() => isAvailable && handleColorSelect(color)}
                            disabled={!isAvailable}
                            className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                              active
                                ? "border-indigo-600 scale-110 shadow-md"
                                : isAvailable
                                  ? "border-gray-300 hover:border-gray-500 hover:scale-105"
                                  : "border-gray-200 opacity-25 cursor-not-allowed"
                            }`}
                            style={{ backgroundColor: hex ?? color }}
                          >
                            {isAvailable && !hasStock && !product!.isPreOrder && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-xs font-black drop-shadow-md">✕</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && !product!.isPreOrder && (
                      <p className="mt-2 text-xs text-amber-600 font-medium">⚠ Only {selectedVariant.stock} left!</p>
                    )}
                    {selectedVariant && selectedVariant.stock === 0 && !product!.isPreOrder && (
                      <p className="mt-2 text-xs text-red-500 font-medium">This combination is out of stock</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Stock / CTA ── */}
            {isOutOfStock ? (
              <p className="text-red-500 font-medium mb-4">Out of stock</p>
            ) : (
              <>
                {!product.isPreOrder && (
                  <div className="flex items-center gap-4 mb-6">
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                      <button
                        className="px-3 py-2 hover:bg-gray-50 flex items-center justify-center"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                      <button
                        className="px-3 py-2 hover:bg-gray-50 flex items-center justify-center"
                        onClick={() => setQty(Math.min(displayStock || 99, qty + 1))}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-400">
                      {displayStock > 0 ? `${displayStock} in stock` : ""}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    isLoading={addingCart}
                    className={`flex-1 ${product.isPreOrder ? "bg-amber-500 hover:bg-amber-600 border-amber-500" : ""}`}
                  >
                    {product.isPreOrder ? (
                      <><Clock className="w-4 h-4 mr-2" /> Pre-order Now</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4 mr-2" /> Add to cart</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOrderNow}
                    isLoading={addingCart}
                    className="flex-1"
                  >
                    Order Now
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
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
          {/* ── Tabs: Specification / Description / Reviews ── */}
        <TabSection product={product} reviews={reviews} isAuthenticated={isAuthenticated} user={user} onSubmitReview={handleSubmitReview} submittingReview={submittingReview} reviewRating={reviewRating} setReviewRating={setReviewRating} reviewComment={reviewComment} setReviewComment={setReviewComment} />

        {/* ── Related products ── */}
        {(relatedLoading || relatedProducts.length > 0) && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

      
      </div>
    </>
  );
}

// ── 3-tab section ──────────────────────────────────────────────────────────
function TabSection({ product, reviews, isAuthenticated, user, onSubmitReview, submittingReview, reviewRating, setReviewRating, reviewComment, setReviewComment }: any) {
  const [activeTab, setActiveTab] = useState<'spec' | 'desc' | 'reviews'>('spec');

  const hasSpecs = product.specifications && Object.keys(product.specifications).length > 0;
  const defaultTab = hasSpecs ? 'spec' : 'desc';
  const [tab, setTab] = useState<'spec' | 'desc' | 'reviews'>(defaultTab);

  const tabs = [
    { id: 'spec', label: 'Specification', show: true },
    { id: 'desc', label: 'Description', show: true },
    { id: 'reviews', label: `Reviews (${product.reviewCount ?? 0})`, show: true },
  ] as const;

  return (
    <div className="mt-16">
      {/* Tab headers */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Specification tab */}
      {tab === 'spec' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {hasSpecs ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-medium text-gray-700 w-2/5 bg-gray-50/50">{key}</td>
                    <td className="px-5 py-3.5 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No specifications available.</p>
          )}
        </div>
      )}

      {/* Description tab */}
      {tab === 'desc' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <DescriptionTabContent text={product.description} />
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div className="space-y-6">
          {reviews?.reviews?.length > 0 ? (
            <div className="space-y-4">
              {reviews.reviews.map((review: any) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user?.name ?? 'Anonymous'}</p>
                      <StarRating value={review.rating} readonly size="sm" className="mt-1" />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && <p className="text-gray-600 mt-2">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet. Be the first!</p>
          )}

          {isAuthenticated && user?.id !== product.userId && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Write a review</h3>
              <form onSubmit={onSubmitReview} className="space-y-4">
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
                    onChange={(e: any) => setReviewComment(e.target.value)}
                    placeholder="Share your experience…"
                  />
                </div>
                <Button type="submit" isLoading={submittingReview}>Submit review</Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DescriptionTabContent({ text }: { text: string }) {
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-2 text-gray-600 leading-relaxed text-sm">
      {lines.map((line: string, i: number) => {
        const isHeader = line.endsWith(':') && !line.startsWith('✅');
        const isCheck = line.startsWith('✅');
        if (isHeader) return <p key={i} className="font-semibold text-gray-800 mt-4 mb-1">{line}</p>;
        if (isCheck) {
          const [label, ...rest] = line.replace('✅', '').trim().split(' – ');
          const detail = rest.join(' – ');
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