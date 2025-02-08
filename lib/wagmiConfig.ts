import { http, createConfig} from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const wagmiConfig = createConfig({
  chains: [base],
  ssr: true,
  connectors: [
    farcasterFrame(),
  ],
  transports: {
    [base.id]: http(),
  },
})
