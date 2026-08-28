import { useRouter } from 'next/navigation';
import { useAppSelector } from '../app/hooks';

export function ProtectedRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  if (!isAuthenticated) router.replace('/login');
  return null;
}

export function AdminRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  if (!isAuthenticated) router.replace('/login');
  else if (user?.role !== 'ADMIN') router.replace('/');
  return null;
}
