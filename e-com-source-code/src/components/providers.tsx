"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "sonner";
import { createQueryClient, createTrpcClient, trpc } from "@/trpc/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(createTrpcClient);

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              className: "font-sans border-border bg-elevated text-foreground",
            }}
          />
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
