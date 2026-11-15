'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/components/auth/auth-provider';

// Shell adapted from TailAdmin's app-layout; retain its 290px sidebar, cards and spacing.
export default function AppShell({children}: {children: React.ReactNode}) {
  const auth = useAuth();
  const pathname = usePathname();
  const items = [{href:'/mascotas',label:'Mascotas'},{href:'/viajes',label:'Viajes'}];
  return <SidebarProvider>
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-5 py-8"><Link href="/mascotas"><img src="/logo.svg" alt="Pet Travel Assistant" width="230" height="50"/></Link></SidebarHeader>
      <SidebarContent className="px-5">
        <p className="mb-4 px-3 text-xs font-medium uppercase text-gray-500">Preparación de viajes</p>
        <nav aria-label="Navegación principal" className="space-y-2">{items.map(item=><Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href)?'page':undefined} className={`menu-item ${pathname.startsWith(item.href)?'menu-item-active':'menu-item-inactive'}`}>{item.label}</Link>)}</nav>
      </SidebarContent>
    </Sidebar>
    <SidebarInset>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3"><SidebarTrigger/><span className="text-sm font-medium text-gray-700">Pet Travel Assistant</span></div>
        <div className="flex items-center gap-3"><span className="hidden text-sm text-gray-600 sm:block">{auth.usuario?.correo}</span><Button variant="outline" onClick={auth.logout}>Cerrar sesión</Button></div>
      </header>
      <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">{children}</div>
    </SidebarInset>
  </SidebarProvider>;
}
