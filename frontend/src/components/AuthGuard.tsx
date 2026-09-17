"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  return <>{children}</>;
}
