'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '../../app/hooks';
import { setCredentials } from '../../features/auth/authSlice';
import { Loader } from '../../components/ui/loader';

export function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    if (accessToken && refreshToken) {
      // Fetch profile then store credentials
      fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((user) => {
          dispatch(setCredentials({ accessToken, refreshToken, user }));
          router.replace('/');
        })
        .catch(() => router.replace('/login'));
    } else {
      router.replace('/login');
    }
  }, [searchParams, dispatch, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader size="lg" label="Completing sign-in" />
      </div>
    </div>
  );
}
