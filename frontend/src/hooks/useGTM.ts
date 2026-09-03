// GTM dataLayer push hook
// GTM dashboard থেকে এই events গুলো GA4, Google Ads, TikTok Pixel যেকোনো জায়গায় পাঠানো যাবে

function pushToDataLayer(event: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(event);
}

export function useGTM() {
  // Page view — route change-এ call করো
  const trackPageView = (url: string) => {
    pushToDataLayer({
      event: 'page_view',
      page_path: url,
    });
  };

  // Product detail page open
  const trackViewItem = (product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }) => {
    pushToDataLayer({
      event: 'view_item',
      ecommerce: {
        currency: 'BDT',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category ?? '',
          price: product.price,
          quantity: 1,
        }],
      },
    });
  };

  // Add to cart
  const trackAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) => {
    pushToDataLayer({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'BDT',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category ?? '',
          price: product.price,
          quantity: product.quantity,
        }],
      },
    });
  };

  // Checkout শুরু
  const trackBeginCheckout = (params: {
    value: number;
    items: { id: string; name: string; price: number; quantity: number }[];
  }) => {
    pushToDataLayer({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'BDT',
        value: params.value,
        items: params.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  };

  // Purchase complete
  const trackPurchase = (params: {
    orderId: string;
    value: number;
    items: { id: string; name: string; price: number; quantity: number }[];
  }) => {
    pushToDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: params.orderId,
        currency: 'BDT',
        value: params.value,
        items: params.items.map(i => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    });
  };

  // Search
  const trackSearch = (searchTerm: string) => {
    pushToDataLayer({
      event: 'search',
      search_term: searchTerm,
    });
  };

  // Wishlist
  const trackAddToWishlist = (product: {
    id: string;
    name: string;
    price: number;
  }) => {
    pushToDataLayer({
      event: 'add_to_wishlist',
      ecommerce: {
        currency: 'BDT',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: 1,
        }],
      },
    });
  };

  return {
    trackPageView,
    trackViewItem,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackSearch,
    trackAddToWishlist,
  };
}
