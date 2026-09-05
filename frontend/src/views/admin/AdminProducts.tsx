'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Boxes, Plus, Pencil, Trash2, X, AlertTriangle, Search, Clock, Upload, FileJson, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Images } from 'lucide-react';
import {
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../features/products/productsApi';
import { useGetFlatCategoriesQuery } from '../../features/categories/categoriesApi';
import { useGetCloudinaryImagesQuery, useUploadImageMutation } from '../../features/admin/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/Skeleton';
import { VariantManager } from './VariantManager';
import { formatCurrency } from '../../utils';
import type { Product } from '../../types/types.index';

const schema = z.object({
  name: z.string().min(2).max(80, 'Name must be 80 characters or less'),
  description: z.string().min(10),
  price: z.union([z.coerce.number().positive(), z.literal('')]),
  comparePrice: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  stock: z.union([z.coerce.number().int().min(0), z.literal('')]),
  categoryId: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPreOrder: z.boolean().optional(),
  preOrderNote: z.string().optional(),
  preOrderDate: z.string().optional(),
  videoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

// JSON import এর জন্য result tracking
interface ImportResult {
  name: string;
  status: 'success' | 'error';
  message?: string;
}

export function AdminProducts() {
  const router = useRouter();
  const pathname = usePathname() ?? '/admin/products';
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [page, setPage] = useState(1);
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showCloudinaryImages, setShowCloudinaryImages] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Batch import state ──────────────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // ── Specifications state (key-value pairs) ──────────────────────────────
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const addSpec = () => setSpecs((prev) => [...prev, { key: '', value: '' }]);
  const removeSpec = (i: number) => setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => {
    setSpecs((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const { data, isLoading, isFetching } = useGetAdminProductsQuery({ page, limit: 15, q: searchQuery || undefined });
  const { data: flatCategories } = useGetFlatCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadImage] = useUploadImageMutation();
  const { data: cloudinaryImages, isLoading: loadingCloudinaryImages } = useGetCloudinaryImagesQuery(undefined, {
    skip: !showModal || !showCloudinaryImages,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema) as any });

  const isPreOrder = watch('isPreOrder');
  const nameValue = watch('name') ?? '';

  useEffect(() => { setSearchInput(searchQuery); }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setLoadedProducts([]);
  }, [searchQuery]);

  useEffect(() => {
    if (!data) return;
    setLoadedProducts((previous) => {
      if (data.page === 1) return data.data;
      const existingIds = new Set(previous.map((product) => product.id));
      return [...previous, ...data.data.filter((product) => !existingIds.has(product.id))];
    });
  }, [data]);

  const hasMoreRef = useRef(false);
  const isFetchingRef = useRef(false);
  hasMoreRef.current = !!data && data.page < data.totalPages;
  isFetchingRef.current = isFetching;

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !isFetchingRef.current) {
          setPage((currentPage) => currentPage + 1);
        }
      },
      { rootMargin: '500px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadedProducts.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
        if (searchInput.trim()) next.set('q', searchInput.trim());
        else next.delete('q');
        next.set('page', '1');
      router.push(`${pathname}?${next.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openCreate = () => {
    setEditProduct(null);
    setImageUrls([]);
    setSpecs([]);
    setShowCloudinaryImages(false);
    reset({ isActive: true, isPreOrder: false, isFeatured: false });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setImageUrls(p.images);
    // specifications object → key-value array
    const existingSpecs = p.specifications
      ? Object.entries(p.specifications).map(([key, value]) => ({ key, value: String(value) }))
      : [];
    setSpecs(existingSpecs);
    setShowCloudinaryImages(false);
    reset({
      name: p.name,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice ?? '',
      stock: p.stock,
      categoryId: p.categoryId,
      tags: p.tags?.join(', ') ?? '',
      isActive: p.isActive ?? true,
      isFeatured: p.isFeatured ?? false,
      isPreOrder: p.isPreOrder ?? false,
      preOrderNote: p.preOrderNote ?? '',
      preOrderDate: p.preOrderDate ? p.preOrderDate.split('T')[0] : '',
      videoUrl: p.videoUrl ?? '',
    });
    setShowModal(true);
  };

  const makePrimaryImage = (index: number) => {
    setImageUrls((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      return [prev[index], ...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  const addCloudinaryImage = (url: string) => {
    setImageUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  // ── Batch image upload (multiple files) ────────────────────────────────
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    const results: string[] = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const url = await uploadImage(formData).unwrap();
        if (url && typeof url === 'string') results.push(url);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (results.length > 0) {
      setImageUrls((prev) => [...prev, ...results]);
      toast.success(`${results.length} image${results.length > 1 ? 's' : ''} uploaded`);
    }
    setUploading(false);
    e.target.value = '';
  };

  const onSubmit = async (data: FormValues) => {
    const payload: any = {
      ...data,
      price: Number(data.price),
      comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
      stock: Number(data.stock),
      images: imageUrls,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      isPreOrder: data.isPreOrder ?? false,
      preOrderNote: data.isPreOrder && data.preOrderNote ? data.preOrderNote : undefined,
      preOrderDate: data.isPreOrder && data.preOrderDate ? data.preOrderDate : undefined,
      videoUrl: data.videoUrl || undefined,
      specifications: specs.length > 0
        ? Object.fromEntries(specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()]))
        : undefined,
    };
    try {
      if (editProduct) {
        await updateProduct({ id: editProduct.id, ...payload }).unwrap();
        toast.success('Product updated');
      } else {
        await createProduct(payload).unwrap();
        toast.success('Product created');
      }
      setShowModal(false);
      reset({});
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Error saving product');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id).unwrap();
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Could not delete product');
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      await updateProduct({ id: product.id, isActive: !product.isActive }).unwrap();
      toast.success(product.isActive ? 'Product deactivated' : 'Product activated');
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Could not update product status');
    }
  };

  // ── JSON batch import ──────────────────────────────────────────────────
  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let products: any[];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      products = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      toast.error('Invalid JSON file');
      e.target.value = '';
      return;
    }

    if (products.length === 0) {
      toast.error('JSON file is empty');
      e.target.value = '';
      return;
    }

    setImportResults([]);
    setImportProgress(0);
    setImportTotal(products.length);
    setImporting(true);
    setShowImportModal(true);

    const results: ImportResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const name = p.name ?? `Product ${i + 1}`;
      try {
        // Basic validation
        if (!p.name) throw new Error('Missing name');
        if (!p.description) throw new Error('Missing description');
        if (!p.price) throw new Error('Missing price');
        if (!p.categoryId) throw new Error('Missing categoryId');
        if (!p.images || !Array.isArray(p.images) || p.images.length === 0) throw new Error('Missing images array');

        await createProduct({
          name: p.name,
          description: p.description,
          price: Number(p.price),
          comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
          stock: Number(p.stock ?? 0),
          images: p.images,
          tags: Array.isArray(p.tags) ? p.tags : [],
          categoryId: p.categoryId,
          isActive: p.isActive ?? true,
          isFeatured: p.isFeatured ?? false,
          isPreOrder: p.isPreOrder ?? false,
          preOrderNote: p.preOrderNote,
          preOrderDate: p.preOrderDate,
        } as any).unwrap();

        results.push({ name, status: 'success' });
      } catch (err: any) {
        const msg = err?.data?.message ?? err?.message ?? 'Unknown error';
        results.push({ name, status: 'error', message: msg });
      }

      setImportProgress(i + 1);
      setImportResults([...results]);
    }

    setImporting(false);
    e.target.value = '';

    const successCount = results.filter((r) => r.status === 'success').length;
    toast.success(`Import done: ${successCount}/${products.length} products created`);
  };

  const rootCats = flatCategories?.filter((c) => !c.parentId) ?? [];
  const subCats = flatCategories?.filter((c) => c.parentId) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2">
          {/* JSON import button */}
          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            <FileJson className="w-4 h-4 text-indigo-500" />
            Import JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleJsonImport}
              disabled={importing}
            />
          </label>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />Add Product
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchInput && (
          <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      {searchQuery ? `No products found for "${searchQuery}"` : 'No products yet.'}
                    </td>
                  </tr>
                ) : (
                  loadedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0] ?? '/placeholder.jpg'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${p.isActive ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full' : 'text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'}`}>
                                {p.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {p.isFeatured && (
                                <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">★ Featured</span>
                              )}
                              {p.isPreOrder && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                  <Clock className="w-3 h-3" /> Pre-order
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(p.price)}</td>
                      <td className="px-6 py-4">
                        {p.isPreOrder ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">Pre-order</span>
                        ) : (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {p.stock > 0 ? p.stock : 'Out of stock'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{p.category?.name ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => toggleProductStatus(p)} title={p.isActive ? 'Deactivate product' : 'Activate product'} className={`p-1.5 ${p.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}>
                            {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button type="button" onClick={() => setVariantProduct(p)} title="Manage variants" className="p-1.5 text-gray-400 hover:text-indigo-600">
                            <Boxes className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-indigo-600">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(p)} className="p-1.5 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div ref={loadMoreRef} className="h-4" />
            {isFetching && loadedProducts.length > 0 && (
              <div className="px-6 py-4 text-center text-sm text-gray-500">Loading more products…</div>
            )}
            {data && !hasMoreRef.current && loadedProducts.length > 0 && (
              <div className="px-6 py-4 text-center text-xs text-gray-400">All {data.total} products loaded</div>
            )}
          </>
        )}
      </div>

      {/* ── JSON Import Progress Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Importing Products</h2>
                {importTotal > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">{importProgress} / {importTotal} processed</p>
                )}
              </div>
              {!importing && (
                <button onClick={() => { setShowImportModal(false); setImportResults([]); }}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Progress bar */}
            {importTotal > 0 && (
              <div className="px-6 pt-4">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress / importTotal) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {importResults.length === 0 && importing && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Reading JSON file…</span>
                </div>
              )}
              {importResults.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${r.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {r.status === 'success'
                    ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${r.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>{r.name}</p>
                    {r.message && <p className="text-xs text-red-600 mt-0.5">{r.message}</p>}
                  </div>
                </div>
              ))}
              {/* Currently processing indicator */}
              {importing && importProgress < importTotal && importResults.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" />
                  <p className="text-sm text-indigo-700">Processing…</p>
                </div>
              )}
            </div>

            {/* Summary footer */}
            {!importing && importResults.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-700 font-medium">
                      ✓ {importResults.filter((r) => r.status === 'success').length} created
                    </span>
                    {importResults.filter((r) => r.status === 'error').length > 0 && (
                      <span className="text-red-600 font-medium">
                        ✗ {importResults.filter((r) => r.status === 'error').length} failed
                      </span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => { setShowImportModal(false); setImportResults([]); }}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-11 h-11 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete product?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
              <div className="flex items-center gap-3">
                {deleteTarget.images[0] && (
                  <img src={deleteTarget.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{deleteTarget.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600" onClick={confirmDelete} isLoading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

              {/* Name with char counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <span className={`text-xs font-medium ${nameValue.length > 80 ? 'text-red-500' : nameValue.length > 45 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {nameValue.length}/80
                  </span>
                </div>
                <input
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${nameValue.length > 80 ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                  {...register('name')}
                />
                {nameValue.length > 80 && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Name too long — {nameValue.length - 80} character কমাও।
                  </p>
                )}
                {nameValue.length > 45 && nameValue.length <= 80 && (
                  <p className="mt-1 text-xs text-amber-500">{80 - nameValue.length} character বাকি</p>
                )}
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('description')} />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (৳)" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
                <Input label="Compare at price (৳)" type="number" step="0.01" error={errors.comparePrice?.message} {...register('comparePrice')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Stock" type="number" error={errors.stock?.message} {...register('stock')} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    {...register('categoryId')}
                  >
                    <option value="">Select…</option>
                    {rootCats.map((root) => {
                      const children = subCats.filter((s) => s.parentId === root.id);
                      return children.length > 0 ? (
                        <optgroup key={root.id} label={root.name}>
                          <option value={root.id}>{root.name} (all)</option>
                          {children.map((c) => (
                            <option key={c.id} value={c.id}>↳ {c.name}</option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={root.id} value={root.id}>{root.name}</option>
                      );
                    })}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
                </div>
              </div>

              <Input label="Tags (comma separated)" placeholder="fashion, summer, sale" {...register('tags')} />

              {/* ── Video URL ── */}
              <div>
                <Input
                  label="Video URL (optional)"
                  placeholder="https://youtube.com/watch?v=... or Facebook video URL"
                  {...register('videoUrl')}
                />
                <p className="mt-1 text-xs text-gray-400">YouTube, Facebook, TikTok বা direct video URL। Product detail page এ first দেখাবে।</p>
                {errors.videoUrl && <p className="mt-1 text-xs text-red-500">{errors.videoUrl.message}</p>}
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-emerald-100 rounded-xl hover:bg-emerald-50/40 transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500" {...register('isActive')} />
                <div>
                  <span className="text-sm font-medium text-gray-800">Active on storefront</span>
                  <p className="text-xs text-gray-500 mt-0.5">Disabled products are hidden from customers but kept in the database.</p>
                </div>
              </label>

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-indigo-100 rounded-xl hover:bg-indigo-50/40 transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500" {...register('isFeatured')} />
                <div>
                  <span className="text-sm font-medium text-gray-800">★ Featured product</span>
                  <p className="text-xs text-gray-500 mt-0.5">Homepage featured section এ দেখাবে</p>
                </div>
              </label>

              {/* Pre-order section */}
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500" {...register('isPreOrder')} />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" /> Pre-order product
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">Stock check ও decrement skip হবে order এ</p>
                  </div>
                </label>
                {isPreOrder && (
                  <>
                    <Input label="Pre-order note" placeholder="e.g. Ships in 2–3 weeks" {...register('preOrderNote')} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Expected availability date <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('preOrderDate')} />
                    </div>
                  </>
                )}
              </div>

              {/* ── Specifications ── */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Specifications</p>
                    <p className="text-xs text-gray-400 mt-0.5">Brand, Material, Size ইত্যাদি — optional</p>
                  </div>
                  <button
                    type="button"
                    onClick={addSpec}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add row
                  </button>
                </div>

                {specs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No specifications added yet.</p>
                )}

                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Key (e.g. Brand)"
                      value={spec.key}
                      onChange={(e) => updateSpec(i, 'key', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. BMW)"
                      value={spec.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Images — batch upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Images</label>
                  <button
                    type="button"
                    onClick={() => setShowCloudinaryImages((visible) => !visible)}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Images className="w-3.5 h-3.5" />
                    {showCloudinaryImages ? 'Hide Cloudinary images' : 'Browse Cloudinary'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                      {i === 0 ? (
                        <span className="absolute bottom-0 left-0 right-0 bg-indigo-600/90 text-white text-[9px] text-center rounded-b-lg">Primary</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => makePrimaryImage(i)}
                          className="absolute bottom-0 left-0 right-0 bg-black/65 text-white text-[9px] py-0.5 rounded-b-lg hover:bg-indigo-600"
                        >Make first</button>
                      )}
                      <button
                        type="button"
                        onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >×</button>
                    </div>
                  ))}
                  {/* Multiple files allowed */}
                  <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 gap-0.5">
                    {uploading
                      ? <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      : <>
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-[10px] text-gray-400">Multi</span>
                        </>}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleBatchImageUpload} disabled={uploading} />
                  </label>
                </div>
                {showCloudinaryImages && (
                  <div className="mt-3 border border-indigo-100 rounded-xl p-3 bg-indigo-50/30">
                    <p className="text-xs font-medium text-gray-700 mb-2">Choose an existing Cloudinary image</p>
                    {loadingCloudinaryImages ? (
                      <p className="text-xs text-gray-400 py-3">Loading images…</p>
                    ) : cloudinaryImages?.length ? (
                      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto">
                        {cloudinaryImages.map((image) => (
                          <button
                            key={image.publicId}
                            type="button"
                            onClick={() => addCloudinaryImage(image.url)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 ${imageUrls.includes(image.url) ? 'border-indigo-600 opacity-50' : 'border-transparent hover:border-indigo-400'}`}
                            title={imageUrls.includes(image.url) ? 'Already selected' : 'Add image'}
                          >
                            <img src={image.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-3">No Cloudinary images found.</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400">Multiple images select করতে পারবে একসাথে</p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={creating || updating} disabled={nameValue.length > 80}>
                  {editProduct ? 'Save changes' : 'Create product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Variants modal ── */}
      {variantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Manage Variants</h2>
                <p className="text-sm text-gray-500 mt-0.5">{variantProduct.name}</p>
              </div>
              <button type="button" onClick={() => setVariantProduct(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <VariantManager productId={variantProduct.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}