import { erc20Abi, type Address } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'
import { ARC_CHAIN_ID } from '@/lib/arc'

/** Reads name, symbol, decimals and total supply straight from the token contract. */
export function useTokenInfo(address: Address) {
  const base = { address, abi: erc20Abi, chainId: ARC_CHAIN_ID } as const
  const query = useReadContracts({
    contracts: [
      { ...base, functionName: 'name' },
      { ...base, functionName: 'symbol' },
      { ...base, functionName: 'decimals' },
      { ...base, functionName: 'totalSupply' },
    ],
  })

  const [name, symbol, decimals, totalSupply] = query.data ?? []

  return {
    isLoading: query.isLoading,
    isError: query.isError || (query.data !== undefined && [name, symbol, decimals, totalSupply].some((r) => r?.status === 'failure')),
    name: name?.status === 'success' ? name.result : undefined,
    symbol: symbol?.status === 'success' ? symbol.result : undefined,
    decimals: decimals?.status === 'success' ? decimals.result : undefined,
    totalSupply: totalSupply?.status === 'success' ? totalSupply.result : undefined,
  }
}

/** ERC-20 balance of `owner` on Arc Testnet. Undefined until a wallet is connected. */
export function useTokenBalance(token: Address, owner: Address | undefined) {
  return useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(owner), refetchInterval: 10_000 },
  })
}
