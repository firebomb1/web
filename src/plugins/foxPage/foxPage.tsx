import { ChevronDownIcon } from '@chakra-ui/icons'
import type { StackDirection } from '@chakra-ui/react'
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Stack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
  useMediaQuery,
} from '@chakra-ui/react'
import type { AssetId, ToAssetIdArgs } from '@shapeshiftoss/caip'
import { ethChainId, foxAssetId, foxyAssetId } from '@shapeshiftoss/caip'
import { supportsETH } from '@shapeshiftoss/hdwallet-core'
import qs from 'qs'
import { useCallback, useMemo } from 'react'
import { useTranslate } from 'react-polyglot'
import { useHistory, useLocation } from 'react-router'
import { AssetMarketData } from 'components/AssetHeader/AssetMarketData'
import { SEO } from 'components/Layout/Seo'
import { WalletActions } from 'context/WalletProvider/actions'
import { useRouteAssetId } from 'hooks/useRouteAssetId/useRouteAssetId'
import { useWallet } from 'hooks/useWallet/useWallet'
import { bn, bnOrZero } from 'lib/bignumber/bignumber'
import { foxyAddresses } from 'lib/investor/investor-foxy'
import { trackOpportunityEvent } from 'lib/mixpanel/helpers'
import { getMixPanel } from 'lib/mixpanel/mixPanelSingleton'
import { MixPanelEvents } from 'lib/mixpanel/types'
import { useGetFoxyAprQuery } from 'state/apis/foxy/foxyApi'
import { useGetAssetDescriptionQuery } from 'state/slices/assetsSlice/assetsSlice'
import { DefiProvider } from 'state/slices/opportunitiesSlice/types'
import { toOpportunityId } from 'state/slices/opportunitiesSlice/utils'
import {
  selectAggregatedEarnUserStakingOpportunityByStakingId,
  selectAssetById,
  selectAssets,
  selectPortfolioCryptoPrecisionBalanceByFilter,
  selectPortfolioUserCurrencyBalanceByAssetId,
  selectSelectedLocale,
} from 'state/slices/selectors'
import { useAppSelector } from 'state/store'
import { breakpoints } from 'theme/theme'

import { AssetActions } from './components/AssetActions'
import { BondProtocolCta } from './components/BondProtocolCta'
import { DappBack } from './components/DappBack'
import { FoxChart } from './components/FoxChart'
import { FoxTab } from './components/FoxTab'
import { Governance } from './components/Governance'
import { Layout } from './components/Layout'
import { MainOpportunity } from './components/MainOpportunity'
import { OtherOpportunities } from './components/OtherOpportunities/OtherOpportunities'
import { Total } from './components/Total'
import type { TradeOpportunitiesBucket } from './components/TradeOpportunities'
import { TradeOpportunities } from './components/TradeOpportunities'
import { foxTradeOpportunitiesBuckets, foxyTradeOpportunitiesBuckets } from './FoxCommon'
import { useOtherOpportunities } from './hooks/useOtherOpportunities'

const gridTemplateColumns = { base: 'repeat(1, 1fr)', lg: 'repeat(3, 1fr)' }
const boxMxProps = { base: 4, md: 0 }
const tabPanelDirectionProps: StackDirection = { base: 'column', xl: 'row' }
const stackMaxWidthProps = { base: 'full', lg: 'sm' }

export enum FoxPageRoutes {
  Fox = '/fox/fox',
  Foxy = '/fox/foxy',
}

const assetsRoutes: Record<AssetId, FoxPageRoutes> = {
  [foxAssetId]: FoxPageRoutes.Fox,
  [foxyAssetId]: FoxPageRoutes.Foxy,
}

const assetsTradeOpportunitiesBuckets: Record<AssetId, TradeOpportunitiesBucket[]> = {
  [foxAssetId]: foxTradeOpportunitiesBuckets,
  [foxyAssetId]: foxyTradeOpportunitiesBuckets,
}

const chevronDownIcon = <ChevronDownIcon />

export const FoxPage = () => {
  const {
    state: { wallet },
    dispatch,
  } = useWallet()
  const translate = useTranslate()
  const history = useHistory()
  const location = useLocation()
  const mixpanel = getMixPanel()

  const activeAssetId = useRouteAssetId()
  const allAssets = useAppSelector(selectAssets)
  // TODO(gomes): Use useRouteAssetId and selectAssetById programmatically
  const assetFox = useAppSelector(state => selectAssetById(state, foxAssetId))
  const assetFoxy = useAppSelector(state => selectAssetById(state, foxyAssetId))
  if (!assetFox) throw new Error(`Asset not found for AssetId ${foxAssetId}`)
  if (!assetFoxy) throw new Error(`Asset not found for AssetId ${foxyAssetId}`)

  const otherOpportunities = useOtherOpportunities(activeAssetId)

  const assets = useMemo(() => [assetFox, assetFoxy], [assetFox, assetFoxy])

  const selectedAssetIndex = useMemo(
    () => assets.findIndex(asset => asset?.assetId === activeAssetId),
    [activeAssetId, assets],
  )

  const selectedAsset = assets[selectedAssetIndex]

  const foxFilter = useMemo(() => ({ assetId: foxAssetId }), [])
  const foxyFilter = useMemo(() => ({ assetId: foxyAssetId }), [])
  const fiatBalanceFox =
    useAppSelector(s => selectPortfolioUserCurrencyBalanceByAssetId(s, foxFilter)) ?? '0'
  const fiatBalanceFoxy =
    useAppSelector(s => selectPortfolioUserCurrencyBalanceByAssetId(s, foxyFilter)) ?? '0'
  const cryptoHumanBalanceFox =
    useAppSelector(s => selectPortfolioCryptoPrecisionBalanceByFilter(s, foxFilter)) ?? '0'
  const cryptoHumanBalanceFoxy =
    useAppSelector(s => selectPortfolioCryptoPrecisionBalanceByFilter(s, foxyFilter)) ?? '0'

  const fiatBalances = useMemo(
    () => [fiatBalanceFox, fiatBalanceFoxy],
    [fiatBalanceFox, fiatBalanceFoxy],
  )

  const cryptoHumanBalances = useMemo(
    () => [cryptoHumanBalanceFox, cryptoHumanBalanceFoxy],
    [cryptoHumanBalanceFox, cryptoHumanBalanceFoxy],
  )

  const { data: foxyAprData, isLoading: isFoxyAprLoading } = useGetFoxyAprQuery()

  const totalFiatBalance = bnOrZero(fiatBalanceFox).plus(bnOrZero(fiatBalanceFoxy)).toString()

  const [isLargerThanMd] = useMediaQuery(`(min-width: ${breakpoints['md']})`, { ssr: false })
  const mobileTabBg = useColorModeValue('gray.100', 'gray.750')
  const description =
    selectedAsset.assetId === foxAssetId
      ? translate('plugins.foxPage.foxDescription') // FOX has a custom description, other assets can use the asset-service one
      : selectedAsset.description

  const selectedLocale = useAppSelector(selectSelectedLocale)
  // TODO(gomes): Export a similar RTK select() query, consumed to determine wallet + staking balance loaded
  const getAssetDescriptionQuery = useGetAssetDescriptionQuery({
    assetId: selectedAsset.assetId,
    selectedLocale,
  })
  const isAssetDescriptionLoaded = !getAssetDescriptionQuery.isLoading

  const toAssetIdParts: ToAssetIdArgs = {
    assetNamespace: 'erc20',
    assetReference: foxyAddresses[0].staking,
    chainId: ethChainId,
  }

  const opportunityId = toOpportunityId(toAssetIdParts)
  const opportunityDataFilter = useMemo(() => {
    return {
      stakingId: opportunityId,
    }
  }, [opportunityId])

  const foxyEarnOpportunityData = useAppSelector(state =>
    opportunityDataFilter
      ? selectAggregatedEarnUserStakingOpportunityByStakingId(state, opportunityDataFilter)
      : undefined,
  )

  const totalIcons = useMemo(() => [assetFox.icon, assetFoxy.icon], [assetFox, assetFoxy])

  const handleTabClick = useCallback(
    (assetId: AssetId, assetName: string) => {
      if (assetId === activeAssetId) {
        return
      }
      mixpanel?.track(MixPanelEvents.Click, { element: `${assetName} toggle` })
      history.push(assetsRoutes[assetId])
    },
    [activeAssetId, history, mixpanel],
  )

  const handleOpportunityClick = useCallback(() => {
    if (!foxyEarnOpportunityData) return
    if (!wallet || !supportsETH(wallet)) {
      dispatch({ type: WalletActions.SET_WALLET_MODAL, payload: true })
      return
    }

    trackOpportunityEvent(
      MixPanelEvents.ClickOpportunity,
      {
        opportunity: foxyEarnOpportunityData,
        element: 'Fox Page Row',
      },
      allAssets,
    )

    history.push({
      pathname: location.pathname,
      search: qs.stringify({
        provider: DefiProvider.ShapeShift,
        chainId: assetFoxy.chainId,
        assetNamespace: 'erc20',
        contractAddress: foxyAddresses[0].foxy,
        assetReference: foxyAddresses[0].staking,
        rewardId: foxyAddresses[0].foxy,
        modal: 'overview',
      }),
      state: { background: location },
    })
  }, [allAssets, assetFoxy.chainId, dispatch, foxyEarnOpportunityData, history, location, wallet])

  const mdFoxTabs = useMemo(
    () =>
      assets.map((asset, index) => (
        <FoxTab
          key={asset.assetId}
          assetSymbol={asset.symbol}
          assetIcon={asset.icon}
          cryptoAmount={cryptoHumanBalances[index]}
          fiatAmount={fiatBalances[index]}
          // eslint-disable-next-line react-memo/require-usememo
          onClick={() => handleTabClick(asset.assetId, asset.name)}
        />
      )),
    [assets, cryptoHumanBalances, fiatBalances, handleTabClick],
  )

  const smFoxTabs = useMemo(
    () =>
      assets.map((asset, index) => (
        // eslint-disable-next-line react-memo/require-usememo
        <MenuItem key={asset.assetId} onClick={() => handleTabClick(asset.assetId, asset.name)}>
          <FoxTab
            assetSymbol={asset.symbol}
            assetIcon={asset.icon}
            cryptoAmount={cryptoHumanBalances[index]}
            fiatAmount={fiatBalances[index]}
            as={Box}
          />
        </MenuItem>
      )),
    [assets, cryptoHumanBalances, fiatBalances, handleTabClick],
  )

  if (!isAssetDescriptionLoaded || !activeAssetId) return null
  if (wallet && supportsETH(wallet) && !foxyEarnOpportunityData) return null

  return (
    <Layout
      title={translate('plugins.foxPage.foxToken', {
        assetSymbol: selectedAsset.symbol,
      })}
      description={description ?? ''}
      icon={selectedAsset.icon}
    >
      <SEO
        title={translate('plugins.foxPage.foxToken', {
          assetSymbol: selectedAsset.symbol,
        })}
      />
      <Tabs variant='unstyled' index={selectedAssetIndex}>
        <TabList>
          <SimpleGrid gridTemplateColumns={gridTemplateColumns} gridGap={4} mb={4} width='full'>
            <Total fiatAmount={totalFiatBalance} icons={totalIcons} />
            {isLargerThanMd && mdFoxTabs}
            {!isLargerThanMd && (
              <Box mb={4}>
                <Menu matchWidth>
                  <Box mx={boxMxProps}>
                    <MenuButton
                      borderWidth='2px'
                      borderColor='primary'
                      height='auto'
                      as={Button}
                      rightIcon={chevronDownIcon}
                      bg={mobileTabBg}
                      width='full'
                    >
                      {selectedAsset && (
                        <FoxTab
                          assetSymbol={selectedAsset.symbol}
                          assetIcon={selectedAsset.icon}
                          cryptoAmount={cryptoHumanBalances[selectedAssetIndex]}
                          fiatAmount={fiatBalances[selectedAssetIndex]}
                        />
                      )}
                    </MenuButton>
                  </Box>
                  <MenuList zIndex={3}>{smFoxTabs}</MenuList>
                </Menu>
              </Box>
            )}
          </SimpleGrid>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Stack alignItems='flex-start' spacing={4} mx='auto' direction={tabPanelDirectionProps}>
              <Stack spacing={4} flex='1 1 0%' width='full'>
                <MainOpportunity
                  assetId={selectedAsset.assetId}
                  apy={foxyAprData?.foxyApr ?? ''}
                  tvl={bnOrZero(foxyEarnOpportunityData?.tvl).toString()}
                  isLoaded={Boolean(foxyEarnOpportunityData && !isFoxyAprLoading)}
                  balance={bnOrZero(foxyEarnOpportunityData?.cryptoAmountBaseUnit)
                    .div(bn(10).pow(assetFoxy.precision))
                    .toFixed()}
                  onClick={handleOpportunityClick}
                />

                <OtherOpportunities
                  title={`plugins.foxPage.otherOpportunitiesTitle.${selectedAsset.symbol}`}
                  description={`plugins.foxPage.otherOpportunitiesDescription.${selectedAsset.symbol}`}
                  opportunities={otherOpportunities}
                />
                <Governance />
              </Stack>
              <Stack flex='1 1 0%' width='full' maxWidth={stackMaxWidthProps} spacing={4}>
                <AssetActions assetId={foxAssetId} />
                <BondProtocolCta />
                <DappBack />
                <TradeOpportunities opportunities={assetsTradeOpportunitiesBuckets[foxAssetId]} />
                <AssetMarketData assetId={selectedAsset.assetId} />
                <FoxChart assetId={foxAssetId} />
              </Stack>
            </Stack>
          </TabPanel>
          <TabPanel p={0}>
            <Stack alignItems='flex-start' spacing={4} mx='auto' direction={tabPanelDirectionProps}>
              <Stack spacing={4} flex='1 1 0%' width='full'>
                <OtherOpportunities
                  title={`plugins.foxPage.otherOpportunitiesTitle.${selectedAsset.symbol}`}
                  description={`plugins.foxPage.otherOpportunitiesDescription.${selectedAsset.symbol}`}
                  opportunities={otherOpportunities}
                />
              </Stack>
              <Stack flex='1 1 0%' width='full' maxWidth={stackMaxWidthProps} spacing={4}>
                <AssetActions assetId={foxyAssetId} />
                <DappBack />
                <TradeOpportunities opportunities={assetsTradeOpportunitiesBuckets[foxyAssetId]} />
                <AssetMarketData assetId={selectedAsset.assetId} />
                <FoxChart assetId={foxyAssetId} />
              </Stack>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  )
}
