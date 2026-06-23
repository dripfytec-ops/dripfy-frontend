import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import QueryProvider from '@/components/providers/QueryProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dripfy — WhatsApp Drip Campaign',
  description: 'Plataforma SaaS de disparos WhatsApp em massa no formato conta-gotas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
      </body>
    </html>
  );
}
