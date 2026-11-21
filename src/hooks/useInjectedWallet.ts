import { useConnectors } from 'wagmi'

/**
 * Checklist item for wallet support. The app uses browser-extension (injected)
 * wallets only; WalletConnect would need a project id that is not configured.
 */
export function useInjectedWallet() {
  const connectors = useConnectors()
  const hasProvider = typeof window !== 'undefined' && 'ethereum' in window
  const injected = connectors.some((connector) => connector.type === 'injected')

  return {
    label: 'Browser wallet',
    ready: hasProvider && injected,
    detail:
      hasProvider && injected
        ? 'Injected wallet detected'
        : 'No browser wallet found. Install one (for example MetaMask). WalletConnect is not configured.',
  }
}
