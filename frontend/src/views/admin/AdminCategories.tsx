import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, FolderOpen, Folder } from 'lucide-react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../features/categories/categoriesApi';
import { useUploadImageMutation } from '../../features/admin/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/Skeleton';
import type { Category } from '../../types/types.index';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  parentId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AdminCategories() {
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Pre-fill parentId when clicking "Add sub-category" button on a row
  const [defaultParentId, setDefaultParentId] = useState<string>('');

  const { data: categories, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [uploadImage] = useUploadImageMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedParentId = watch('parentId');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreate = (parentId = '') => {
    setEditCat(null);
    setImageUrl('');
    setDefaultParentId(parentId);
    reset({ name: '', description: '', parentId });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setImageUrl(cat.image ?? '');
    setDefaultParentId(cat.parentId ?? '');
    reset({
      name: cat.name,
      description: cat.description ?? '',
      parentId: cat.parentId ?? '',
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
      setImageUrl(url);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      const payload = {
        ...data,
        slug,
        image: imageUrl || undefined,
        parentId: data.parentId || undefined, // empty string → undefined (root category)
      };

      if (editCat) {
        await updateCategory({ id: editCat.id, ...payload }).unwrap();
        toast.success('Category updated');
      } else {
        await createCategory(payload).unwrap();
        toast.success('Category created');
        // নতুন sub-category বানালে parent expand করো
        if (payload.parentId) {
          setExpandedIds((prev) => new Set([...prev, payload.parentId!]));
        }
      }
      setShowModal(false);
      reset({});
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Error saving category');
    }
  };

  const handleDelete = async (cat: Category) => {
    const hasChildren = cat.subCategories && cat.subCategories.length > 0;
    const msg = hasChildren
      ? `"${cat.name}" has sub-categories. Delete them first.`
      : `Delete "${cat.name}"?`;
    if (hasChildren) { toast.error(msg); return; }
    if (!confirm(msg)) return;
    try {
      await deleteCategory(cat.id).unwrap();
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Could not delete');
    }
  };

  // Root categories only (tree আসে backend থেকে)
  const rootCategories = categories ?? [];
  const totalCount = rootCategories.reduce(
    (sum, c) => sum + 1 + (c.subCategories?.length ?? 0),
    0,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {rootCategories.length} root · {totalCount} total
            </p>
          )}
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No categories yet.{' '}
            <button onClick={() => openCreate()} className="text-indigo-600 hover:underline">
              Create one
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Products</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rootCategories.map((cat) => {
                const isExpanded = expandedIds.has(cat.id);
                const hasSubs = (cat.subCategories?.length ?? 0) > 0;
                const totalProducts =
                  (cat._count?.products ?? 0) +
                  (cat.subCategories?.reduce((s, c) => s + (c._count?.products ?? 0), 0) ?? 0);

                return (
                  <>
                    {/* ── Root category row ── */}
                    <tr key={cat.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Expand toggle */}
                          <button
                            type="button"
                            onClick={() => hasSubs && toggleExpand(cat.id)}
                            className={`text-gray-400 ${hasSubs ? 'hover:text-gray-700 cursor-pointer' : 'opacity-0 pointer-events-none'}`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          {cat.image ? (
                            <img src={cat.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              {hasSubs ? (
                                <FolderOpen className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Folder className="w-4 h-4 text-indigo-400" />
                              )}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-900">{cat.name}</span>
                            {hasSubs && (
                              <span className="ml-2 text-xs text-gray-400">
                                {cat.subCategories!.length} sub
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{totalProducts}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {cat.description ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 justify-end">
                          {/* Add sub-category shortcut */}
                          <button
                            onClick={() => openCreate(cat.id)}
                            title="Add sub-category"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Sub-category rows (collapsible) ── */}
                    {isExpanded &&
                      cat.subCategories?.map((sub) => (
                        <tr key={sub.id} className="hover:bg-indigo-50/30 bg-gray-50/50">
                          <td className="px-6 py-3 pl-14">
                            <div className="flex items-center gap-2">
                              {sub.image ? (
                                <img src={sub.image} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Folder className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                              )}
                              <span className="text-gray-700">{sub.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-400 text-xs">{sub._count?.products ?? 0}</td>
                          <td className="px-6 py-3 text-gray-400 text-xs max-w-xs truncate">
                            {sub.description ?? '—'}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => openEdit(sub)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(sub)}
                                className="p-1.5 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editCat ? 'Edit Category' : selectedParentId ? 'New Sub-category' : 'New Category'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Input label="Name" error={errors.name?.message} {...register('name')} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('description')}
                />
              </div>

              {/* Parent category dropdown — root categories only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent category
                  <span className="ml-1 text-gray-400 font-normal">(leave empty for root)</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('parentId')}
                >
                  <option value="">— Root category —</option>
                  {/* Only root categories can be parents (max 2 levels) */}
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id} disabled={editCat?.id === c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                {imageUrl && (
                  <div className="relative inline-block mb-2">
                    <img src={imageUrl} alt="" className="w-24 h-24 rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                <label className="cursor-pointer text-sm text-indigo-600 hover:underline block">
                  {uploading ? 'Uploading…' : imageUrl ? 'Change image' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={creating || updating}>
                  {editCat ? 'Save changes' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
