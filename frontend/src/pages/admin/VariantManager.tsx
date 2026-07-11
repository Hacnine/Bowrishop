import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} from '../../features/products/productsApi';
import { useUploadImageMutation } from '../../features/admin/adminApi';
import { formatCurrency } from '../../utils';
import type { ProductVariant, CreateVariantPayload } from '../../types/types.index';

const EMPTY_FORM: CreateVariantPayload = {
  color: '',
  colorHex: '#000000',
  size: '',
  price: 0,
  comparePrice: undefined,
  stock: 0,
  sku: '',
  images: [],
  isActive: true,
};

// ─── Image uploader strip used inside the variant form ────────────────────────
function VariantImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploadImage] = useUploadImageMutation();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const url = await uploadImage(fd).unwrap();
      if (url) onChange([...images, url]);
      else toast.error('Upload failed: no URL returned');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Variant images{' '}
        <span className="text-gray-400">(shown when this color is selected)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-16 h-16 flex-shrink-0">
            <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs leading-none"
            >
              ×
            </button>
          </div>
        ))}

        <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors flex-shrink-0">
          {uploading ? (
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5 text-gray-400" />
              <span className="text-[10px] text-gray-400 mt-0.5">Upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

// ─── Variant form (add + edit) ────────────────────────────────────────────────
function VariantForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: CreateVariantPayload;
  onSave: (data: CreateVariantPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CreateVariantPayload>({
    ...initial,
    images: initial.images ?? [],
  });
  const set = (k: keyof CreateVariantPayload, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Color name */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Color name</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Rose Gold"
            value={form.color ?? ''}
            onChange={(e) => set('color', e.target.value)}
          />
        </div>

        {/* Color swatch */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Color swatch</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
              value={form.colorHex ?? '#000000'}
              onChange={(e) => set('colorHex', e.target.value)}
            />
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="#000000"
              value={form.colorHex ?? ''}
              onChange={(e) => {
                // Normalise shorthand (#abc → #aabbcc) so backend @IsHexColor() never rejects it
                const raw = e.target.value.trim();
                const normalised =
                  /^#[0-9a-fA-F]{3}$/.test(raw)
                    ? '#' + [...raw.slice(1)].map((c) => c + c).join('')
                    : raw;
                set('colorHex', normalised);
              }}
            />
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Small, Medium, Large, One Size"
            value={form.size ?? ''}
            onChange={(e) => set('size', e.target.value)}
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            SKU <span className="text-gray-400">(optional)</span>
          </label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. SKU-001-BLK-LG"
            value={form.sku ?? ''}
            onChange={(e) => set('sku', e.target.value)}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Price <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.price}
              onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Compare price */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Compare-at price <span className="text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.00"
              value={form.comparePrice ?? ''}
              onChange={(e) =>
                set('comparePrice', e.target.value ? parseFloat(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Stock <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={0}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.stock}
            onChange={(e) => set('stock', parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Active / visible</span>
          </label>
        </div>
      </div>

      {/* ── Image uploader (full width row) ─────────────────────────────── */}
      <VariantImageUploader
        images={form.images ?? []}
        onChange={(urls) => set('images', urls)}
      />

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button
          type="button"
          disabled={isSaving || form.price == null}
          onClick={() => onSave(form)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {isSaving ? 'Saving…' : 'Save variant'}
        </button>
      </div>
    </div>
  );
}

// ─── Main VariantManager ──────────────────────────────────────────────────────
export function VariantManager({ productId }: { productId: string }) {
  const { data: variants = [], isLoading } = useGetVariantsQuery(productId);
  const [createVariant, { isLoading: creating }] = useCreateVariantMutation();
  const [updateVariant, { isLoading: updating }] = useUpdateVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleCreate = async (data: CreateVariantPayload) => {
    try {
      await createVariant({ productId, data }).unwrap();
      toast.success('Variant added');
      setShowAdd(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Could not add variant');
    }
  };

  const handleUpdate = async (variantId: string, data: CreateVariantPayload) => {
    try {
      await updateVariant({ productId, variantId, data }).unwrap();
      toast.success('Variant updated');
      setEditingId(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Could not update variant');
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Delete this variant? This cannot be undone.')) return;
    try {
      await deleteVariant({ productId, variantId }).unwrap();
      toast.success('Variant deleted');
    } catch {
      toast.error('Could not delete variant');
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900">Product Variants</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Each variant = a unique color + size combo with its own price, stock & images
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowAdd(true); setCollapsed(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add variant
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {showAdd && (
            <div className="mb-4">
              <VariantForm
                initial={EMPTY_FORM}
                onSave={handleCreate}
                onCancel={() => setShowAdd(false)}
                isSaving={creating}
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse" />
              ))}
            </div>
          ) : variants.length === 0 && !showAdd ? (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
              No variants yet — click <strong>Add variant</strong> to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((v: ProductVariant) =>
                editingId === v.id ? (
                  <VariantForm
                    key={v.id}
                    initial={{
                      color: v.color,
                      colorHex: v.colorHex,
                      size: v.size,
                      price: Number(v.price),
                      comparePrice: v.comparePrice ? Number(v.comparePrice) : undefined,
                      stock: v.stock,
                      sku: v.sku,
                      images: v.images ?? [],
                      isActive: v.isActive,
                    }}
                    onSave={(data) => handleUpdate(v.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSaving={updating}
                  />
                ) : (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white transition-colors"
                  >
                    {/* Color swatch + name/sku */}
                    <div className="flex items-center gap-3 min-w-0">
                      {v.colorHex && (
                        <span
                          className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {[v.color, v.size].filter(Boolean).join(' / ') || 'No color or size'}
                        </p>
                        {v.sku && <p className="text-xs text-gray-400 font-mono">{v.sku}</p>}
                      </div>
                    </div>

                    {/* Variant images preview strip */}
                    {v.images && v.images.length > 0 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {v.images.slice(0, 4).map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-gray-200"
                          />
                        ))}
                        {v.images.length > 4 && (
                          <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                            +{v.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price / stock / status */}
                    <div className="flex items-center gap-6 text-sm flex-shrink-0">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(Number(v.price))}</p>
                        {v.comparePrice && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatCurrency(Number(v.comparePrice))}
                          </p>
                        )}
                      </div>
                      <div className="text-right w-14">
                        <p className={`font-semibold ${v.stock === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                          {v.stock}
                        </p>
                        <p className="text-xs text-gray-400">in stock</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          v.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {v.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(v.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit variant"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}