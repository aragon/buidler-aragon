import BN from 'bn.js'

function transformTokenData(tokenData) {
  const { decimals, totalSupply } = tokenData
  return {
    ...tokenData,
    decimals: new BN(decimals),
    numDecimals: parseInt(decimals, 10),
    tokenDecimalsBase: new BN(10).pow(new BN(decimals)),
    totalSupply: new BN(totalSupply),
  }
}

function appStateReducer(state) {
  if (state === null) {
    return { syncing: true }
  }

  const { depositedToken, holders, wrappedToken } = state

  return {
    ...state,
    depositedToken: depositedToken && transformTokenData(depositedToken),
    holders:
      holders &&
      holders
        .map(holder => ({ ...holder, balance: new BN(holder.balance) }))
        .sort((a, b) => b.balance.cmp(a.balance)),
    wrappedToken: wrappedToken && transformTokenData(wrappedToken),
  }
}

export default appStateReducer
