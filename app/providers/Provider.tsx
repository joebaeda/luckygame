"use client"

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { FrameSplashProvider } from "./FrameSplashProvider";
import { FrameContextProvider } from "./FrameContextProvider";


const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <FrameSplashProvider>
      <FrameContextProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            {/* */}
            {children}
            {/* */}
          </QueryClientProvider>
        </WagmiProvider>
      </FrameContextProvider>
    </FrameSplashProvider>
  );
}