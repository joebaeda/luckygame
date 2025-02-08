import { http, createConfig, injected} from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const wagmiConfig = createConfig({
  chains: [base],
  ssr: true,
  connectors: [
    injected(),
    farcasterFrame(),
  ],
  transports: {
    [base.id]: http(),
  },
})
