import React, { useCallback, useMemo, useState } from 'react'
import {
  Button,
  GU,
  Info,
  Field,
  SidePanel,
  TextInput,
  useSidePanelFocusOnReady,
  useTheme,
} from '@aragon/ui'
import wrap from '../assets/wrap.svg'
import { fromDecimals, toDecimals } from '../utils'

// Any more and the number input field starts to put numbers in scientific notation
const MAX_INPUT_DECIMAL_BASE = 6

const WrapTokensPanel = React.memo(
  ({ action, info, onAction, depositedToken, panelState, wrappedToken }) => {
    return (
      <SidePanel
        title={action + ' tokens'}
        opened={panelState.visible}
        onClose={panelState.requestClose}
      >
        <WrapTokensPanelContent
          action={action}
          depositedToken={depositedToken}
          info={info}
          onAction={onAction}
          wrappedToken={wrappedToken}
        />
      </SidePanel>
    )
  }
)

function WrapTokensPanelContent({
  action,
  depositedToken,
  info,
  onAction,
  wrappedToken,
}) {
  const theme = useTheme()

  const [amount, setAmount] = useState('')
  const tokenInputRef = useSidePanelFocusOnReady()

  const tokenData = useMemo(
    () => (action === 'Wrap' ? depositedToken : wrappedToken),
    [action, depositedToken, wrappedToken]
  )
  const handleAmountChange = useCallback(event => {
    setAmount(event.target.value)
  }, [])
  const handleSubmit = useCallback(
    event => {
      event.preventDefault()

      onAction(toDecimals(amount.trim(), tokenData.numDecimals))
    },
    [amount, onAction, tokenData]
  )

  const tokenStep = fromDecimals(
    '1',
    Math.min(MAX_INPUT_DECIMAL_BASE, tokenData.numDecimals)
  )

  return (
    <form
      css={`
        margin-top: ${3 * GU}px;
      `}
      onSubmit={handleSubmit}
    >
      <div
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <Info>{info}</Info>
      </div>
      <Field label={action === 'Wrap' ? 'Amount' : 'Wrapped token amount'}>
        <div css="display: flex">
          <TextInput
            ref={tokenInputRef}
            type="number"
            value={amount}
            min={tokenStep}
            step={tokenStep}
            onChange={handleAmountChange}
            adornment={
              action === 'Wrap' ? depositedToken.symbol : wrappedToken.symbol
            }
            adornmentPosition="end"
            adornmentSettings={{
              width: 60,
              padding: 8,
            }}
            required
            wide
            css={`
              &::-webkit-inner-spin-button,
              &::-webkit-outer-spin-button {
                -webkit-appearance: none;
              }
            `}
          />
          <div
            css={`
              display: flex;
              flex-shrink: 0;
              align-items: center;
            `}
          >
            <img
              src={wrap}
              css={`
                margin: 0 ${2 * GU}px;
              `}
            />
            <span
              css={`
                color: ${theme.surfaceContentSecondary};
                margin-right: ${0.5 * GU}px;
                min-width: ${6 * GU}px;
                max-width: ${12 * GU}px;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: right;
              `}
            >
              {amount || 0}
            </span>
            <span
              css={`
                color: ${theme.surfaceContentSecondary};
              `}
            >
              {action === 'Wrap' ? wrappedToken.symbol : depositedToken.symbol}
            </span>
          </div>
        </div>
      </Field>
      <Button disabled={!amount} mode="strong" type="submit" wide>
        {action} tokens
      </Button>
    </form>
  )
}
WrapTokensPanelContent.defaultProps = {
  onAction: () => {},
}

export default WrapTokensPanel
