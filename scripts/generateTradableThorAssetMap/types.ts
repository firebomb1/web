import type { AssetId, ChainId } from '@shapeshiftoss/caip'
import {
  avalancheChainId,
  bchChainId,
  binanceChainId,
  bscChainId,
  btcChainId,
  cosmosChainId,
  dogeChainId,
  ethChainId,
  ltcChainId,
  thorchainChainId,
} from '@shapeshiftoss/caip'

export enum ThorchainChain {
  BTC = 'BTC',
  DOGE = 'DOGE',
  LTC = 'LTC',
  BCH = 'BCH',
  ETH = 'ETH',
  AVAX = 'AVAX',
  BNB = 'BNB',
  GAIA = 'GAIA',
  THOR = 'THOR',
  BSC = 'BSC',
}

export const ChainToChainIdMap: Map<ThorchainChain, ChainId> = new Map([
  [ThorchainChain.BTC, btcChainId],
  [ThorchainChain.DOGE, dogeChainId],
  [ThorchainChain.LTC, ltcChainId],
  [ThorchainChain.BCH, bchChainId],
  [ThorchainChain.ETH, ethChainId],
  [ThorchainChain.AVAX, avalancheChainId],
  [ThorchainChain.BNB, binanceChainId],
  [ThorchainChain.GAIA, cosmosChainId],
  [ThorchainChain.THOR, thorchainChainId],
  [ThorchainChain.BSC, bscChainId],
])

export type AssetIdPair = [thorchainAsset: string, assetId: AssetId]
