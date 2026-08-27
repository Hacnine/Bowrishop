import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetCartQuery } from '../features/cart/cartApi';
import { useAppSelector } from '../app/hooks';

const WHATSAPP_NUMBER = '8801341075481';
const WHATSAPP_MESSAGE = encodeURIComponent('হ্যালো! আমি Bowri Shop থেকে অর্ডার করতে চাই।');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.526 5.845L.057 23.625a.75.75 0 0 0 .921.921l5.78-1.469A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.587-.5-5.084-1.373l-.364-.217-3.773.958.974-3.682-.236-.374A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

export function Footer() {
  return (
    <>
      {/* ── Main Footer ── */}
      <footer className="bg-gray-900 text-gray-300">
        {/* mobile bottom nav এর উপরে যাতে footer content hide না হয় */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 sm:pb-10" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>

          {/* Brand + WhatsApp row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-2xl font-bold text-white">Bowri Shop</span>
              <p className="mt-1 text-sm text-gray-400 max-w-xs">
                Your one-stop destination for trending products at the best prices.
              </p>
            </div>
         
          
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Social */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Follow Us</h4>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/bowrishop/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-colors">
                  <FacebookIcon />
                </a>
                <a href="https://www.instagram.com/bowrishop/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-colors">
                  <InstagramIcon />
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-colors">
                  <WhatsAppIcon />
                </a>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Call / WhatsApp</p>
                <a href="tel:+8801341075481" className="text-sm text-white font-medium hover:text-green-400 transition-colors">
                  01341075481
                </a>
              </div>
            </div>

            {/* Shop links */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
                <li><Link to="/products?sale=true" className="hover:text-white transition-colors">On Sale</Link></li>
                <li><Link to="/products?preOrder=true" className="hover:text-white transition-colors">Pre-order</Link></li>
                <li><Link to="/products?inStock=true" className="hover:text-white transition-colors">In Stock</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/profile" className="hover:text-white transition-colors">My Profile</Link></li>
                <li><Link to="/profile/orders" className="hover:text-white transition-colors">My Orders</Link></li>
                <li><Link to="/profile/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Bowri Shop. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp button ──
          Mobile: bottom-20 (56px nav + gap), icon only, pill shape
          Desktop: bottom-6, icon + number
      ── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed z-50 right-4 bottom-[76px] sm:bottom-6 sm:right-6 bg-green-500 hover:bg-green-600 text-white shadow-xl rounded-full p-3 flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95"
      >
        <WhatsAppIcon />
        <span className="hidden text-sm">01341075481</span>
      </a>

      {/* ── Mobile bottom nav bar ── */}
      <MobileBottomNav />
    </>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { isAuthenticated } = useAuth();
  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const guestCartCount = useAppSelector((state) =>
    state.guestCart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const cartCount = isAuthenticated
    ? (cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0)
    : guestCartCount;

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 h-14">
        {[
          { to: '/', label: 'Home', icon: <HomeIcon /> },
          { to: '/products', label: 'Shop', icon: <GridIcon /> },
          { to: '/cart', label: 'Cart', icon: <CartIcon /> },
          { to: '/profile', label: 'Account', icon: <UserIcon /> },
        ].map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive(to) ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'
            }`}
          >
            <span className="relative">
              {icon}
              {to === '/cart' && cartCount > 0 && (
                <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 bg-indigo-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);