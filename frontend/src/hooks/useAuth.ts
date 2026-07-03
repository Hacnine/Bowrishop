import { useAppSelector } from '../app/hooks';

export function useAuth() {
  const { user, isAuthenticated, accessToken } = useAppSelector((s) => s.auth);
  return { user, isAuthenticated, accessToken, isAdmin: user?.role === 'ADMIN' };
}
