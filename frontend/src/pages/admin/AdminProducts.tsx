import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Boxes, Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../features/products/productsApi';
import { useGetCategoriesQuery } from '../../features/categories/categoriesApi';
import { useUploadImageMutation } from '../../features/admin/adminApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { VariantManager } from './VariantManager';
import { formatCurrency, slugify } from '../../utils';
import type { Product } from '../../types/types.index';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.union([z.coerce.number().positive(), z.literal('')]),
  comparePrice: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  stock: z.union([z.coerce.number().int().min(0), z.literal('')]),
  categoryId: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AdminProducts() {
  const [page, setPage] = useState(1);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useGetProductsQuery({ page, limit: 15 });
  const { data: categories } = useGetCategoriesQuery();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadImage] = useUploadImageMutation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  });

  const openCreate = () => {
    setEditProduct(null);
    setImageUrls([]);
    reset({});
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
      console.log('Uploading file:', file.name, file.size);
      const url = await uploadImage(formData).unwrap();
      console.log('Upload response:', url);
      if (url && typeof url === 'string') {
        setImageUrls((prev) => [...prev, url]);
        toast.success('Image uploaded');
      } else {
        console.error('Invalid URL response:', url);
        toast.error('Upload failed: Invalid response');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      slug: editProduct ? editProduct.slug : slugify(data.name),
      price: Number(data.price),
      comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
      stock: Number(data.stock),
      images: imageUrls,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deleted');
    } catch {
      toast.error('Could not delete product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Product</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
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
              {data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0] ?? '/placeholder.jpg'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{formatCurrency(p.price)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {p.stock > 0 ? p.stock : 'Out of stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{p.category?.name ?? '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setVariantProduct(p)}
                        title="Manage variants"
                        aria-label={`Manage variants for ${p.name}`}
                        className="p-1.5 text-gray-400 hover:text-indigo-600"
                      >
                        <Boxes className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        title="Edit product"
                        aria-label={`Edit ${p.name}`}
                        className="p-1.5 text-gray-400 hover:text-indigo-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        title="Delete product"
                        aria-label={`Delete ${p.name}`}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editProduct ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Input label="Name" error={errors.name?.message} {...register('name')} />
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
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('categoryId')}>
                    <option value="">Select…</option>
                    {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
                </div>
              </div>
              <Input label="Tags (comma separated)" placeholder="fashion, summer, sale" {...register('tags')} />

              {/* Image upload */}
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
                    {uploading ? <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" /> : <Plus className="w-5 h-5 text-gray-400" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={creating || updating}>{editProduct ? 'Save changes' : 'Create product'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {variantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Manage Variants</h2>
                <p className="text-sm text-gray-500 mt-0.5">{variantProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setVariantProduct(null)}
                aria-label="Close variants"
              >
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
