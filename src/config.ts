/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 *
 * Arc Testnet is the only chain this app talks to. Mainnets are deliberately
 * not configured, so a wallet on any other network is shown as unsupported.
 */

import { http, createConfig } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(),
  },
})
