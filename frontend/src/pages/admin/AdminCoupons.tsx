import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '../../features/coupons/couponsApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../utils';
import type { Coupon } from '../../types/types.index';

const schema = z.object({
  code: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discount: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  minOrder: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  maxUses: z.union([z.coerce.number().int().min(1), z.literal('')]).optional(),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AdminCoupons() {
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: coupons, isLoading } = useGetCouponsQuery();
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
  });

  const openCreate = () => {
    setEditCoupon(null);
    reset({ discountType: 'PERCENTAGE' });
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    reset({
      description: c.description ?? '',
      isActive: c.isActive,
      maxUses: c.maxUses ?? '',
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (editCoupon) {
        const updatePayload = {
          description: data.description || undefined,
          isActive: data.isActive,
          maxUses: data.maxUses ? Number(data.maxUses) : undefined,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        };
        await updateCoupon({ code: editCoupon.code, ...updatePayload }).unwrap();
        toast.success('Coupon updated');
      } else {
        if (!data.code || !data.discountType || !data.discount) {
          toast.error('Code, type, and value are required');
          return;
        }
        const createPayload = {
          code: data.code.toUpperCase(),
          discountType: data.discountType,
          discount: Number(data.discount),
          description: data.description || undefined,
          minOrder: data.minOrder ? Number(data.minOrder) : undefined,
          maxUses: data.maxUses ? Number(data.maxUses) : undefined,
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        };
        await createCoupon(createPayload).unwrap();
        toast.success('Coupon created');
      }
      setShowModal(false);
      reset({});
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message ?? 'Error saving coupon');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(code).unwrap();
      toast.success('Deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Coupon</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Discount</th>
                <th className="px-6 py-4 font-medium">Uses</th>
                <th className="px-6 py-4 font-medium">Expires</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {c.discountType === 'PERCENTAGE' ? `${c.discount}%` : formatCurrency(Number(c.discount))}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-6 py-4 text-gray-500">{c.expiresAt ? formatDate(c.expiresAt) : 'No expiry'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.code)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {editCoupon ? (
                <>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
                    <span className="text-gray-500">Code: </span><span className="font-mono font-bold">{editCoupon.code}</span>
                    <span className="ml-4 text-gray-500">Discount: </span><span className="font-semibold">{editCoupon.discountType === 'PERCENTAGE' ? `${editCoupon.discount}%` : `$${editCoupon.discount}`}</span>
                  </div>
                  <Input label="Description" placeholder="10% off your first order" {...register('description')} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Max uses" type="number" {...register('maxUses')} />
                    <Input label="Expires at" type="date" {...register('expiresAt')} />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isActive" {...register('isActive')} className="w-4 h-4 rounded" />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </>
              ) : (
                <>
                  <Input label="Code" error={errors.code?.message} placeholder="SAVE20" {...register('code')} />
                  <Input label="Description" placeholder="10% off your first order" {...register('description')} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                      <select className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register('discountType')}>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed amount</option>
                      </select>
                    </div>
                    <Input label="Value" type="number" step="0.01" error={errors.discount?.message} {...register('discount')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Min order (৳)" type="number" {...register('minOrder')} />
                    <Input label="Max uses" type="number" {...register('maxUses')} />
                  </div>
                  <Input label="Expires at" type="date" {...register('expiresAt')} />
                </>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={creating || updating}>{editCoupon ? 'Save' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
