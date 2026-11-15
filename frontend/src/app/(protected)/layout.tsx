'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/components/auth/auth-provider';
import AppShell from '@/components/layout/app-shell';
import {Button} from '@/components/ui/button';

export default function ProtectedLayout({children}: {children: React.ReactNode}) {
  const auth = useAuth();
  const router = useRouter();
  useEffect(()=> { if (!auth.loading && !auth.usuario && !auth.error) router.replace('/login'); }, [auth.loading, auth.usuario, auth.error, router]);
  if (auth.error) return <main className="p-8"><p role="alert">{auth.error}</p><Button onClick={auth.retry}>Reintentar</Button></main>;
  if (auth.loading || !auth.usuario) return <main className="p-8"><p role="status">Verificando sesión…</p></main>;
  return <AppShell>{children}</AppShell>;
}
