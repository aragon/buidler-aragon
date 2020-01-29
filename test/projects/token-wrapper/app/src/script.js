import 'core-js/stable'
import 'regenerator-runtime/runtime'

import Aragon, { events } from '@aragon/api'
import { addressesEqual } from './web3-utils'
import tokenBalanceOfABI from './abi/token-balanceOf.json'
import tokenDecimalsABI from './abi/token-decimals.json'
import tokenNameABI from './abi/token-name.json'
import tokenSymbolABI from './abi/token-symbol.json'
import tokenTotalSupplyABI from './abi/token-totalSupply.json'

const tokenAbi = [].concat(
  tokenBalanceOfABI,
  tokenDecimalsABI,
  tokenNameABI,
  tokenSymbolABI,
  tokenTotalSupplyABI
)
const app = new Aragon()

app.store(
  async (state, event) => {
    const { event: eventName } = event

    switch (eventName) {
      case events.SYNC_STATUS_SYNCING:
        return { ...state, isSyncing: true }
      case events.SYNC_STATUS_SYNCED:
        return { ...state, isSyncing: false }
      case 'Deposit':
      case 'Withdrawal':
        return updateHolder(state, event)
      default:
        return state
    }
  },
  { init: initState }
)

async function initState(cachedState) {
  const initializedState = {
    ...cachedState,
  }

  // Wrapped token details (from the app itself)
  const currentApp = await app.currentApp().toPromise()
  const currentAppMethodProxy = new Proxy(app, {
    get(target, name, receiver) {
      return (...params) => target.call(name, ...params)
    },
  })
  initializedState.wrappedToken = {
    address: currentApp.appAddress,
    ...(await getTokenData(currentAppMethodProxy)),
  }

  // Deposited token details
  const depositedTokenAddress = await getDepositedTokenAddress()
  const depositedTokenContract = app.external(depositedTokenAddress, tokenAbi)
  initializedState.depositedToken = {
    address: depositedTokenAddress,
    ...(await getTokenData(depositedTokenContract)),
  }

  app.identify(`${initializedState.wrappedToken.symbol}`)

  return initializedState
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function getDepositedTokenAddress() {
  return app.call('depositedToken').toPromise()
}

async function getTokenData(tokenContract) {
  const [decimals, name, symbol, totalSupply] = await Promise.all([
    // Decimals, name, and symbol are optional
    tokenContract
      .decimals()
      .toPromise()
      .catch(_ => '0'),
    tokenContract
      .name()
      .toPromise()
      .catch(_ => ''),
    tokenContract
      .symbol()
      .toPromise()
      .catch(_ => ''),

    tokenContract.totalSupply().toPromise(),
  ])

  return {
    decimals,
    name,
    symbol,
    totalSupply,
  }
}

async function updateHolder(state, event) {
  const { holders = [], wrappedToken } = state
  const { entity: account } = event.returnValues

  const holderIndex = holders.findIndex(holder =>
    addressesEqual(holder.address, account)
  )

  const currentBalance = await app.call('balanceOf', account).toPromise()

  let nextHolders = Array.from(holders)
  if (holderIndex === -1) {
    // New holder
    nextHolders.push({ address: account, balance: currentBalance })
  } else {
    nextHolders[holderIndex].balance = currentBalance
  }
  // Filter out any addresses that now have no balance
  nextHolders = nextHolders.filter(({ balance }) => balance !== '0')

  const nextWrappedToken = {
    ...wrappedToken,
    totalSupply: await app.call('totalSupply').toPromise(),
  }

  return { ...state, holders: nextHolders, wrappedToken: nextWrappedToken }
}
