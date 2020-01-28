import React, { useCallback } from 'react'
import {
  AragonApi,
  useApi,
  useAppState,
  useCurrentApp,
} from '@aragon/api-react'
import appStateReducer from './app-state-reducer'
import usePanelState from './hooks/usePanelState'

function noop() {}

// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const api = useApi()
  return useCallback(
    amount => {
      // Don't care about response
      api.withdraw(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

// Wrap tokens action
export function useWrapTokensAction(onDone = noop) {
  const api = useApi()
  const { depositedToken } = useAppState()
  const currentApp = useCurrentApp()
  return useCallback(
    amount => {
      if (!currentApp || !depositedToken) {
        return
      }

      // Set pre-transaction parameters for approving original token
      const intentParams = {
        token: {
          address: depositedToken.address,
          value: amount,
          spender: currentApp.appAddress,
        },
        // While it's generally a bad idea to hardcode gas in intents, in the case of token deposits
        // it prevents metamask from doing the gas estimation and telling the user that their
        // transaction will fail (before the approve is mined).
        // The actual gas cost is around ~130k but we do the estimation with some breathing room
        // in case it is being forwarded (unlikely in deposit).
        gas: 200000,
      }

      // Don't care about response
      api.deposit(amount, intentParams).toPromise()
      onDone()
    },
    [api, currentApp, depositedToken, onDone]
  )
}

// Handles the main logic of the app.
export function useAppLogic() {
  const wrapTokensPanel = usePanelState()
  const unwrapTokensPanel = usePanelState()

  const actions = {
    wrapTokens: useWrapTokensAction(wrapTokensPanel.requestClose),
    unwrapTokens: useUnwrapTokensAction(unwrapTokensPanel.requestClose),
  }

  return {
    actions,
    wrapTokensPanel: wrapTokensPanel,
    unwrapTokensPanel: unwrapTokensPanel,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
