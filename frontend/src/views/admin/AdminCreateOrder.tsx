import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, X, ArrowLeft, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateAdminCustomOrderMutation } from '../../features/orders/ordersApi';
import { useGetAdminProductsQuery } from '../../features/products/productsApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { formatCurrency } from '../../utils';
import type { Product, ProductVariant } from '../../types/types.index';

interface OrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantLabel?: string;
  quantity: number;
  customPrice: number;
  image?: string;
}

export function AdminCreateOrder() {
  const router = useRouter();
  const [createOrder, { isLoading }] = useCreateAdminCustomOrderMutation();

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [shippingCharge, setShippingCharge] = useState(80);
  const [notes, setNotes] = useState('');
  const [skipStock, setSkipStock] = useState(false);

  // Product search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Order items
  const [items, setItems] = useState<OrderItem[]>([]);

  const { data: searchData } = useGetAdminProductsQuery(
    { q: searchQuery, limit: 10 },
    { skip: searchQuery.length < 2 },
  );

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const variantLabel = selectedVariant
      ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' / ')
      : undefined;

    const variant = selectedVariant ?? selectedProduct.variants?.[0];
    if (!variant) return;
    const basePrice = Number(variant.price);

    const newItem: OrderItem = {
      productId: selectedProduct.id,
      variantId: variant.id,
      productName: selectedProduct.name,
      variantLabel,
      quantity: 1,
      customPrice: basePrice,
      image: selectedProduct.images[0],
    };

    // Duplicate check
    const exists = items.find(
      (i) => i.productId === newItem.productId && i.variantId === newItem.variantId,
    );
    if (exists) {
      toast.error('This product/variant is already added');
      return;
    }

    setItems((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    setSelectedVariant(null);
  };

  const updateItem = (index: number, field: 'quantity' | 'customPrice', value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.customPrice * item.quantity, 0);
  const total = subtotal + shippingCharge;

  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error('Customer name required'); return; }
    if (!customerPhone.trim()) { toast.error('Customer phone required'); return; }
    if (!address.trim()) { toast.error('Address required'); return; }
    if (!city.trim()) { toast.error('City required'); return; }
    if (items.length === 0) { toast.error('Add at least one product'); return; }

    try {
      const order = await createOrder({
        customerName,
        customerPhone,
        address,
        city,
        district,
        shippingCharge,
        notes,
        skipStockUpdate: skipStock,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          customPrice: item.customPrice,
          productName: item.productName,
        })),
      }).unwrap();

      toast.success('Custom order created!');
      router.push('/admin/orders');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to create order');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/admin/orders')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Custom Order</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin manual order — custom price support</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Customer + Products */}
        <div className="lg:col-span-2 space-y-6">

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
              />
              <Input
                label="Phone *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="mt-4">
              <Input
                label="Address *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, Road, Area"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="City *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dhaka"
              />
              <Input
                label="District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Dhaka"
              />
            </div>
          </div>

          {/* Product Search & Add */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Add Products</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search product by name…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Search results dropdown */}
              {showSearch && searchData?.data && searchData.data.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
                  {searchData.data.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <img
                        src={product.images[0] ?? '/placeholder.jpg'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(Number(product.variants?.[0]?.price ?? 0))}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected product — variant & add */}
            {selectedProduct && (
              <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/40 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={selectedProduct.images[0] ?? '/placeholder.jpg'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-500">Original: {formatCurrency(Number(selectedProduct.variants?.[0]?.price ?? 0))}</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Variant selector */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Select Variant</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVariant(null)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${!selectedVariant ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                      >
                        No variant
                      </button>
                      {selectedProduct.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${selectedVariant?.id === v.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                        >
                          {[v.color, v.size].filter(Boolean).join(' / ')} — {formatCurrency(v.price)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add to Order
                </Button>
              </div>
            )}

            {/* Items list */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No products added yet
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {item.image && (
                      <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                      {item.variantLabel && (
                        <p className="text-xs text-gray-500">{item.variantLabel}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-500">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="w-14 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Custom price */}
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-gray-500">৳</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.customPrice}
                        onChange={(e) => updateItem(index, 'customPrice', Number(e.target.value))}
                        className="w-20 border border-indigo-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-indigo-50"
                      />
                    </div>

                    <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                      {formatCurrency(item.customPrice * item.quantity)}
                    </p>

                    <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, special instructions…"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Right — Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Shipping</span>
                <input
                  type="number"
                  min={0}
                  value={shippingCharge}
                  onChange={(e) => setShippingCharge(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span className="text-indigo-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Skip stock update */}
            <label className="flex items-center gap-2.5 cursor-pointer mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                checked={skipStock}
                onChange={(e) => setSkipStock(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-amber-800">Skip stock update</p>
                <p className="text-xs text-amber-600 mt-0.5">Stock কমাবে না</p>
              </div>
            </label>

            <Button
              className="w-full"
              isLoading={isLoading}
              onClick={handleSubmit}
              disabled={items.length === 0}
            >
              Create Order
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Order টা "[Admin Order]" note সহ তৈরি হবে
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCreateOrder;
