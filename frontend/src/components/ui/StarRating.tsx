import { Star } from 'lucide-react';
import { cn } from '../../utils';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ value, max = 5, size = 'sm', readonly, onChange, className }: StarRatingProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className={cn('flex gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
            !readonly && 'cursor-pointer hover:text-amber-400',
          )}
          onClick={() => !readonly && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
}
