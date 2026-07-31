'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // Mantém os dados da tela anterior em cache por mais tempo, então
        // voltar pra uma tela já visitada mostra o último conteúdo na hora
        // (e atualiza por trás), em vez de piscar um spinner de novo.
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
