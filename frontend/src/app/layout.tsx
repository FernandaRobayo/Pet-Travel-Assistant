import type {Metadata} from 'next';
import AuthProvider from '@/components/auth/auth-provider';
import {TooltipProvider} from '@/components/ui/tooltip';
import './globals.css';

export const metadata: Metadata = {title: 'Pet Travel Assistant', description: 'Organiza la preparación de un viaje con tu mascota.'};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="es"><body><AuthProvider><TooltipProvider>{children}</TooltipProvider></AuthProvider></body></html>;
}
