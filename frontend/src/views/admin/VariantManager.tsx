import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, ImagePlus, Grid3X3, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} from '../../features/products/productsApi';
import { useUploadImageMutation } from '../../features/admin/adminApi';
import { formatCurrency } from '../../utils';
import { Loader } from '../../components/ui/loader';
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

// ─── Preset size groups ────────────────────────────────────────────────────────
const SIZE_PRESETS: Record<string, string[]> = {
  'Clothing (S-XXL)': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Shoes (EU)': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  'Bra Size': ['32A', '32B', '32C', '34A', '34B', '34C', '36A', '36B', '36C', '38B', '38C'],
  'Underwear': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Kids (Age)': ['2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y'],
  'One Size': ['One Size'],
};

const COLOR_PRESETS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#ca8a04' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Brown', hex: '#92400e' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Beige', hex: '#d4b483' },
  { name: 'Maroon', hex: '#800000' },
];

// ─── Image uploader ────────────────────────────────────────────────────────────
function VariantImageUploader({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) {
  const [uploadImage] = useUploadImageMutation();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const url = await uploadImage(fd).unwrap();
        if (url) urls.push(url);
      }
      if (urls.length) onChange([...images, ...urls]);
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((url, i) => (
        <div key={i} className="relative w-14 h-14">
          <img src={url} className="w-full h-full object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
        </div>
      ))}
      <label className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 flex-shrink-0">
        {uploading ? <Loader size="sm" label="Uploading images" /> : <ImagePlus className="w-5 h-5 text-gray-400" />}
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

// ─── Single variant form ───────────────────────────────────────────────────────
function VariantForm({
  initial, onSave, onCancel, isSaving,
}: {
  initial: CreateVariantPayload;
  onSave: (data: CreateVariantPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CreateVariantPayload>(initial);
  const set = (k: keyof CreateVariantPayload, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
      {/* Size */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
        <input value={form.size ?? ''} onChange={(e) => set('size', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. M, 38, 34B" />
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
        <div className="flex gap-1.5">
          <input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Red" />
          <input type="color" value={form.colorHex ?? '#000000'} onChange={(e) => set('colorHex', e.target.value)}
            className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Price (৳)</label>
        <input type="number" min={0} step={0.01} value={form.price}
          onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* Compare Price */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Compare Price (৳)</label>
        <input type="number" min={0} step={0.01} value={form.comparePrice ?? ''}
          onChange={(e) => set('comparePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Optional" />
      </div>

      {/* Stock */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
        <input type="number" min={0} value={form.stock}
          onChange={(e) => set('stock', parseInt(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {/* SKU */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
        <input value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Optional" />
      </div>

      {/* Images */}
      <div className="col-span-full">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Images</label>
        <VariantImageUploader images={form.images ?? []} onChange={(urls) => set('images', urls)} />
      </div>

      {/* Actions */}
      <div className="col-span-full flex gap-2 pt-1">
        <button type="button" onClick={() => onSave(form)} disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          <Check className="w-4 h-4" /> {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Bulk variant generator ────────────────────────────────────────────────────
function BulkVariantCreator({ productId, existingVariants, onCreate }: {
  productId: string;
  existingVariants: ProductVariant[];
  onCreate: (variants: CreateVariantPayload[]) => Promise<void>;
}) {
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState({ name: '', hex: '#000000' });
  const [defaultPrice, setDefaultPrice] = useState(0);
  const [defaultStock, setDefaultStock] = useState(0);
  const [creating, setCreating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');

  const toggleSize = (s: string) => setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const toggleColor = (c: { name: string; hex: string }) =>
    setColors((prev) => prev.some((x) => x.name === c.name) ? prev.filter((x) => x.name !== c.name) : [...prev, c]);

  const addCustomSize = () => {
    if (customSize.trim() && !sizes.includes(customSize.trim())) {
      setSizes((prev) => [...prev, customSize.trim()]);
      setCustomSize('');
    }
  };

  const addCustomColor = () => {
    if (customColor.name.trim() && !colors.some((c) => c.name === customColor.name.trim())) {
      setColors((prev) => [...prev, { name: customColor.name.trim(), hex: customColor.hex }]);
      setCustomColor({ name: '', hex: '#000000' });
    }
  };

  // Matrix: সব size × color combination
  const matrix = useMemo(() => {
    if (sizes.length === 0 || colors.length === 0) return [];
    return sizes.flatMap((size) =>
      colors.map((color) => ({ size, color: color.name, colorHex: color.hex }))
    );
  }, [sizes, colors]);

  // Already existing combinations
  const existingCombos = useMemo(() =>
    new Set(existingVariants.map((v) => `${v.size ?? ''}|${v.color ?? ''}`)),
    [existingVariants]
  );

  const newVariants = matrix.filter((m) => !existingCombos.has(`${m.size}|${m.color}`));

  const handleCreate = async () => {
    if (newVariants.length === 0) { toast.error('No new variants to create'); return; }
    setCreating(true);
    try {
      await onCreate(newVariants.map((v) => ({
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        price: defaultPrice,
        stock: defaultStock,
        images: [],
        isActive: true,
      })));
      toast.success(`${newVariants.length} variants created!`);
      setSizes([]);
      setColors([]);
    } catch {
      toast.error('Failed to create some variants');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="border border-indigo-200 rounded-xl bg-indigo-50/30 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-indigo-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Bulk Create (Size × Color Matrix)</h3>
      </div>

      {/* Size preset selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Sizes</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {Object.entries(SIZE_PRESETS).map(([label, presetSizes]) => (
            <button key={label} type="button"
              onClick={() => { setSizes(presetSizes); setSelectedPreset(label); }}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${selectedPreset === label ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {Array.from(new Set([...Object.values(SIZE_PRESETS).flat(), ...sizes])).map((s) => (
            <button key={s} type="button" onClick={() => toggleSize(s)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${sizes.includes(s) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customSize} onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomSize()}
            placeholder="Custom size (e.g. 34B, XXXL)"
            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="button" onClick={addCustomSize}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">Add</button>
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Colors</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COLOR_PRESETS.map((c) => {
            const selected = colors.some((x) => x.name === c.name);
            return (
              <button key={c.name} type="button" onClick={() => toggleColor(c)}
                title={c.name}
                className={`relative w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-indigo-600 scale-110' : 'border-gray-300 hover:border-gray-500'}`}
                style={{ backgroundColor: c.hex }}>
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className={`w-4 h-4 ${c.hex === '#ffffff' ? 'text-gray-800' : 'text-white'}`} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 items-center">
          <input value={customColor.name} onChange={(e) => setCustomColor((p) => ({ ...p, name: e.target.value }))}
            placeholder="Color name"
            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="color" value={customColor.hex} onChange={(e) => setCustomColor((p) => ({ ...p, hex: e.target.value }))}
            className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
          <button type="button" onClick={addCustomColor}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">Add</button>
        </div>
        {/* Selected colors preview */}
        {colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {colors.map((c) => (
              <span key={c.name} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs">
                <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
                {c.name}
                <button onClick={() => setColors((p) => p.filter((x) => x.name !== c.name))} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Default price + stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Default Price (৳)</label>
          <input type="number" min={0} value={defaultPrice} onChange={(e) => setDefaultPrice(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Default Stock</label>
          <input type="number" min={0} value={defaultStock} onChange={(e) => setDefaultStock(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Preview matrix */}
      {matrix.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">
            Preview: {newVariants.length} new variants
            {matrix.length !== newVariants.length && ` (${matrix.length - newVariants.length} already exist, skipped)`}
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1.5 text-left border border-gray-200">Size</th>
                  {colors.map((c) => (
                    <th key={c.name} className="px-2 py-1.5 border border-gray-200">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => (
                  <tr key={size} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 font-medium border border-gray-200">{size}</td>
                    {colors.map((color) => {
                      const exists = existingCombos.has(`${size}|${color.name}`);
                      return (
                        <td key={color.name} className={`px-2 py-1.5 text-center border border-gray-200 ${exists ? 'bg-green-50 text-green-600' : 'text-gray-600'}`}>
                          {exists ? '✓ exists' : '+ new'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button type="button" onClick={handleCreate} disabled={creating || newVariants.length === 0}
        className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        {creating ? `Creating ${newVariants.length} variants…` : `Create ${newVariants.length} variants`}
      </button>
    </div>
  );
}

// ─── Main VariantManager ───────────────────────────────────────────────────────
export function VariantManager({ productId }: { productId: string }) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  const { data: variants = [], isLoading } = useGetVariantsQuery(productId);
  const [createVariant, { isLoading: creating }] = useCreateVariantMutation();
  const [updateVariant, { isLoading: updating }] = useUpdateVariantMutation();
  const [deleteVariant] = useDeleteVariantMutation();

  const handleCreate = async (data: CreateVariantPayload) => {
    try {
      await createVariant({ productId, data }).unwrap();
      toast.success('Variant created');
      setAddingNew(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to create variant');
    }
  };

  const handleBulkCreate = async (variants: CreateVariantPayload[]) => {
    const results = await Promise.allSettled(
      variants.map((v) => createVariant({ productId, data: v }).unwrap())
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) toast.error(`${failed} variants failed (may already exist)`);
  };

  const handleUpdate = async (id: string, data: CreateVariantPayload) => {
    try {
      await updateVariant({ productId, variantId: id, data }).unwrap();
      toast.success('Variant updated');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to update variant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    try {
      await deleteVariant({ productId, variantId: id }).unwrap();
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Group variants by size for display
  const groupedBySizeAndColor = useMemo(() => {
    const sizeMap = new Map<string, ProductVariant[]>();
    for (const v of variants) {
      const key = v.size ?? 'No Size';
      if (!sizeMap.has(key)) sizeMap.set(key, []);
      sizeMap.get(key)!.push(v);
    }
    return sizeMap;
  }, [variants]);

  if (isLoading) return <div className="py-4 flex justify-center"><Loader size="md" label="Loading variants" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{variants.length} variant{variants.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setShowBulk(!showBulk); setAddingNew(false); }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${showBulk ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Grid3X3 className="w-4 h-4" /> Bulk Create
          </button>
          <button type="button" onClick={() => { setAddingNew(!addingNew); setShowBulk(false); }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${addingNew ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            <Plus className="w-4 h-4" /> Add Single
          </button>
        </div>
      </div>

      {/* Bulk creator */}
      {showBulk && (
        <BulkVariantCreator
          productId={productId}
          existingVariants={variants}
          onCreate={handleBulkCreate}
        />
      )}

      {/* Single add form */}
      {addingNew && (
        <VariantForm
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setAddingNew(false)}
          isSaving={creating}
        />
      )}

      {/* Variants list — grouped by size */}
      {variants.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-300 rounded-xl">
          No variants yet. Use Bulk Create or Add Single.
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from(groupedBySizeAndColor.entries()).map(([size, sizeVariants]) => (
            <div key={size} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Size header */}
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Size: {size}</span>
                <span className="text-xs text-gray-400">{sizeVariants.length} color{sizeVariants.length !== 1 ? 's' : ''}</span>
              </div>
              {/* Color variants under this size */}
              <div className="divide-y divide-gray-100">
                {sizeVariants.map((variant) => (
                  <div key={variant.id}>
                    {editingId === variant.id ? (
                      <div className="p-3">
                        <VariantForm
                          initial={{
                            color: variant.color ?? '',
                            colorHex: variant.colorHex ?? '#000000',
                            size: variant.size ?? '',
                            price: Number(variant.price),
                            comparePrice: variant.comparePrice ? Number(variant.comparePrice) : undefined,
                            stock: variant.stock,
                            sku: variant.sku ?? '',
                            images: variant.images ?? [],
                            isActive: variant.isActive,
                          }}
                          onSave={(data) => handleUpdate(variant.id, data)}
                          onCancel={() => setEditingId(null)}
                          isSaving={updating}
                        />
                      </div>
                    ) : (
                      <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                        {/* Color swatch */}
                        <div className="w-7 h-7 rounded-full border-2 border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: variant.colorHex ?? '#e5e7eb' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{variant.color ?? 'No color'}</span>
                            {!variant.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span>{formatCurrency(Number(variant.price))}</span>
                            {variant.comparePrice && <span className="line-through">{formatCurrency(Number(variant.comparePrice))}</span>}
                            <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                              Stock: {variant.stock}
                            </span>
                            {variant.sku && <span>SKU: {variant.sku}</span>}
                          </div>
                        </div>
                        {/* Images preview */}
                        {variant.images?.length > 0 && (
                          <div className="flex gap-1">
                            {variant.images.slice(0, 2).map((img, i) => (
                              <img key={i} src={img} className="w-8 h-8 rounded object-cover border border-gray-200" />
                            ))}
                            {variant.images.length > 2 && <span className="text-xs text-gray-400 self-center">+{variant.images.length - 2}</span>}
                          </div>
                        )}
                        {/* Actions */}
                        <div className="flex gap-1">
                          <button type="button" onClick={() => setEditingId(variant.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDelete(variant.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}