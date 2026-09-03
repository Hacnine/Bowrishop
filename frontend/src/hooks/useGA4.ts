// GA4 event tracking hook
// gtag automatically track করে: page views, sessions, bounce rate
// এখানে শুধু ecommerce events manually fire করছি

type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: GtagFn };
  if (!w.dataLayer) return;
  w.dataLayer.push(args);
}

export function useGA4() {
  const trackViewItem = (product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  }) => {
    gtag('event', 'view_item', {
      currency: 'BDT',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1,
      }],
    });
  };

  const trackAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) => {
    gtag('event', 'add_to_cart', {
      currency: 'BDT',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: product.quantity,
      }],
    });
  };

  const trackBeginCheckout = (params: {
    value: number;
    items: { id: string; name: string; price: number; quantity: number }[];
  }) => {
    gtag('event', 'begin_checkout', {
      currency: 'BDT',
      value: params.value,
      items: params.items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  };

  const trackPurchase = (params: {
    orderId: string;
    value: number;
    items: { id: string; name: string; price: number; quantity: number }[];
  }) => {
    gtag('event', 'purchase', {
      transaction_id: params.orderId,
      currency: 'BDT',
      value: params.value,
      items: params.items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  };

  const trackSearch = (searchTerm: string) => {
    gtag('event', 'search', { search_term: searchTerm });
  };

  return { trackViewItem, trackAddToCart, trackBeginCheckout, trackPurchase, trackSearch };
}
