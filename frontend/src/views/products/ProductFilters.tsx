'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types/types.index';

export type ProductFiltersProps = {
  categories?: Category[];
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  preOrder: boolean;
  onParamChange: (key: string, value: string) => void;
  onClear: () => void;
  /** Optional: renders a close button in the header (used by the mobile drawer) */
  onClose?: () => void;
};

export function ProductFilters({
  categories,
  categoryId,
  minPrice,
  maxPrice,
  inStock,
  preOrder,
  onParamChange,
  onClear,
  onClose,
}: ProductFiltersProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCatExpand = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6 sticky top-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">Filters</span>
        {onClose && (
          <button onClick={onClose} aria-label="Close filters">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="radio"
              name="cat"
              value=""
              checked={!categoryId}
              onChange={() => onParamChange('categoryId', '')}
              className="text-indigo-600"
            />
            <span className="text-sm text-gray-700">All</span>
          </label>

          {categories?.map((root) => {
            const hasSubs = (root.subCategories?.length ?? 0) > 0;
            const isExpanded = expandedCats.has(root.id);
            const isSelected = categoryId === root.id;
            const childSelected = root.subCategories?.some((s) => s.id === categoryId);

            return (
              <div key={root.id}>
                <div className="flex items-center gap-1">
                  {hasSubs && (
                    <button
                      type="button"
                      onClick={() => toggleCatExpand(root.id)}
                      className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      {isExpanded || childSelected ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <label className={`flex items-center gap-2 cursor-pointer py-1 flex-1 ${!hasSubs ? 'pl-5' : ''}`}>
                    <input
                      type="radio"
                      name="cat"
                      value={root.id}
                      checked={isSelected}
                      onChange={() => {
                        onParamChange('categoryId', root.id);
                        if (hasSubs) setExpandedCats((prev) => new Set([...prev, root.id]));
                      }}
                      className="text-indigo-600"
                    />
                    <span className={`text-sm ${isSelected || childSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                      {root.name}
                    </span>
                    {root._count?.products !== undefined && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {root._count.products +
                          (root.subCategories?.reduce((s, c) => s + (c._count?.products ?? 0), 0) ?? 0)}
                      </span>
                    )}
                  </label>
                </div>

                {hasSubs && (isExpanded || childSelected) && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-3">
                    {root.subCategories!.map((sub) => (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="radio"
                          name="cat"
                          value={sub.id}
                          checked={categoryId === sub.id}
                          onChange={() => onParamChange('categoryId', sub.id)}
                          className="text-indigo-600"
                        />
                        <span className={`text-sm ${categoryId === sub.id ? 'text-indigo-700 font-medium' : 'text-gray-600'}`}>
                          {sub.name}
                        </span>
                        {sub._count?.products !== undefined && (
                          <span className="text-xs text-gray-400 ml-auto">{sub._count.products}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Price range</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            defaultValue={minPrice}
            onBlur={(e) => onParamChange('minPrice', e.target.value)}
          />
          <input
            type="number"
            placeholder="Max"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            defaultValue={maxPrice}
            onBlur={(e) => onParamChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      {/* In stock */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => onParamChange('inStock', e.target.checked ? 'true' : '')}
          className="rounded text-indigo-600"
        />
        <span className="text-sm text-gray-700">In stock only</span>
      </label>

      {/* Pre-order */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={preOrder}
          onChange={(e) => onParamChange('preOrder', e.target.checked ? 'true' : '')}
          className="rounded text-amber-600"
        />
        <span className="text-sm text-gray-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" /> Pre-order only
        </span>
      </label>

      <Button variant="outline" size="sm" className="w-full cursor-pointer" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
