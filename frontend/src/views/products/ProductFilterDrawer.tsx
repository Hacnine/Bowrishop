'use client';

import { useEffect } from 'react';
import { ProductFilters, type ProductFiltersProps } from './ProductFilters';

type ProductFilterDrawerProps = ProductFiltersProps & {
  open: boolean;
  onClose: () => void;
};

export function ProductFilterDrawer({ open, onClose, ...filterProps }: ProductFilterDrawerProps) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto transform transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <ProductFilters {...filterProps} onClose={onClose} />
      </div>
    </div>
  );
}
