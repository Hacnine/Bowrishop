import { cn } from '../../utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = {
  sm: 'td-loader-sm',
  md: 'td-loader-md',
  lg: 'td-loader-lg',
};

export function Loader({ className, size = 'md', label }: LoaderProps) {
  return (
    <span className={cn('td-loader-wrap', className)} role="status" aria-label={label ?? 'Loading'}>
      <span className={cn('td-loader', sizes[size])} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function LoadingState({ className, label = 'Loading' }: Omit<LoaderProps, 'size'>) {
  return (
    <div className={cn('flex min-h-32 items-center justify-center', className)}>
      <Loader size="lg" label={label} />
    </div>
  );
}
