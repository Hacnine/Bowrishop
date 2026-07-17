import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Boxes, Plus, Pencil, Trash2, X, AlertTriangle, Search, Clock } from 'lucide-react';
import {
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../features/products/productsApi';
import { useGetFlatCategoriesQuery } from '../../features/categories/categoriesApi';
import { useUploadImageMutation } from '../../features/admin/adminApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { VariantManager } from './VariantManager';
import { formatCurrency } from '../../utils';
import type { Product } from '../../types/types.index';

const schema = z.object({
  name: z.string().min(2).max(60, 'Name must be 60 characters or less'),
  description: z.string().min(10),
  price: z.union([z.coerce.number().positive(), z.literal('')]),
  comparePrice: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  stock: z.union([z.coerce.number().int().min(0), z.literal('')]),
  categoryId: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  isFeatured: z.boolean().optional(),
  // Pre-order fields
  isPreOrder: z.boolean().optional(),
  preOrderNote: z.string().optional(),
  preOrderDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const searchQuery = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useGetAdminProductsQuery({ page, limit: 15, q: searchQuery || undefined });
  // Flat list — parent > sub hierarchy dropdown তে দেখাবে
  const { data: flatCategories } = useGetFlatCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadImage] = useUploadImageMutation();

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
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) next.set('q', searchInput.trim());
        else next.delete('q');
        next.set('page', '1');
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });
  };

  const openCreate = () => {
    setEditProduct(null);
    setImageUrls([]);
    reset({ isPreOrder: false, isFeatured: false });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setImageUrls(p.images);
    reset({
      name: p.name,
      description: p.description,
      price: p.price,
      comparePrice: p.comparePrice ?? '',
      stock: p.stock,
      categoryId: p.categoryId,
      tags: p.tags?.join(', ') ?? '',
      isFeatured: p.isFeatured ?? false,
      isPreOrder: p.isPreOrder ?? false,
      preOrderNote: p.preOrderNote ?? '',
      preOrderDate: p.preOrderDate ? p.preOrderDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadImage(formData).unwrap();
      if (url && typeof url === 'string') {
        setImageUrls((prev) => [...prev, url]);
        toast.success('Image uploaded');
      } else {
        toast.error('Upload failed: Invalid response');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const payload: any = {
      ...data,
      price: Number(data.price),
      comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
      stock: Number(data.stock),
      images: imageUrls,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isFeatured: data.isFeatured ?? false,
      isPreOrder: data.isPreOrder ?? false,
      // Pre-order fields: empty string → undefined
      preOrderNote: data.isPreOrder && data.preOrderNote ? data.preOrderNote : undefined,
      preOrderDate: data.isPreOrder && data.preOrderDate ? data.preOrderDate : undefined,
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

  // Flat categories কে grouped options এ convert করো
  const rootCats = flatCategories?.filter((c) => !c.parentId) ?? [];
  const subCats = flatCategories?.filter((c) => c.parentId) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />Add Product
        </Button>
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
          <button
            type="button"
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
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
                {data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      {searchQuery ? `No products found for "${searchQuery}"` : 'No products yet.'}
                    </td>
                  </tr>
                ) : (
                  data?.data.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] ?? '/placeholder.jpg'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {p.isFeatured && (
                                <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                  ★ Featured
                                </span>
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
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                            Pre-order
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {p.stock > 0 ? p.stock : 'Out of stock'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
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

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {page} of {data.totalPages} · {data.total} products
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    ← Prev
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`e-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                      ) : (
                        <button key={p} onClick={() => setPage(p as number)} className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      )
                    )}
                  <button onClick={() => setPage(page + 1)} disabled={page === data.totalPages} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <span className={`text-xs font-medium ${nameValue.length > 60 ? 'text-red-500' : nameValue.length > 45 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {nameValue.length}/60
                  </span>
                </div>
                <input
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${nameValue.length > 60 ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                  {...register('name')}
                />
                {nameValue.length > 60 && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Name too long — card এ কাটা যাবে। {nameValue.length - 60} character কমাও।
                  </p>
                )}
                {nameValue.length > 45 && nameValue.length <= 60 && (
                  <p className="mt-1 text-xs text-amber-500">{60 - nameValue.length} character বাকি</p>
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
                  {/* Grouped dropdown: root categories + their sub-categories */}
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

              {/* ── Featured toggle ── */}
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-indigo-100 rounded-xl hover:bg-indigo-50/40 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  {...register('isFeatured')}
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">★ Featured product</span>
                  <p className="text-xs text-gray-500 mt-0.5">Homepage featured section এ দেখাবে</p>
                </div>
              </label>

              {/* ── Pre-order section ── */}
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500"
                    {...register('isPreOrder')}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Pre-order product
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">Stock check ও decrement skip হবে order এ</p>
                  </div>
                </label>

                {isPreOrder && (
                  <>
                    <Input
                      label="Pre-order note"
                      placeholder="e.g. Ships in 2–3 weeks"
                      {...register('preOrderNote')}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Expected availability date
                        <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        {...register('preOrderDate')}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >×</button>
                    </div>
                  ))}
                  <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400">
                    {uploading
                      ? <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      : <Plus className="w-5 h-5 text-gray-400" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={creating || updating} disabled={nameValue.length > 60}>
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