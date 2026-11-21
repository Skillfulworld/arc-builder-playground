import { useAccount, useSwitchChain } from 'wagmi'
import { ARC_CHAIN, ARC_CHAIN_ID } from '@/lib/arc'

/**
 * Compares the wallet's network with the one network this app supports.
 * `walletChainName` is only known for configured chains, so any other network
 * is reported by its numeric id instead of a guessed name.
 */
export function useNetwork() {
  const { isConnected, chainId, chain } = useAccount()
  const { switchChain, isPending, error } = useSwitchChain()

  const wrongNetwork = isConnected && chainId !== ARC_CHAIN_ID
  const walletChainName = chain?.name ?? (chainId !== undefined ? `Chain ${chainId}` : undefined)

  return {
    appChainName: ARC_CHAIN.name,
    isConnected,
    wrongNetwork,
    isReady: isConnected && !wrongNetwork,
    walletChainName,
    switchToArc: () => switchChain({ chainId: ARC_CHAIN_ID }),
    switching: isPending,
    switchError: error,
  }
}
