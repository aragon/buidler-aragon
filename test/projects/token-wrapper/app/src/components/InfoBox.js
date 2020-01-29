import React from 'react'
import { useNetwork } from '@aragon/api-react'
import { Box, GU, TokenBadge, useTheme, textStyle } from '@aragon/ui'
import wrap from '../assets/wrap.svg'
import { fromDecimals } from '../utils'

function InfoBox({ depositedToken, wrappedToken }) {
  const network = useNetwork()
  const theme = useTheme()

  const totalSupply = wrappedToken.totalSupply
    ? fromDecimals(
        wrappedToken.totalSupply.toString(),
        wrappedToken.numDecimals
      )
    : '0'

  return (
    <React.Fragment>
      <Box heading="Wrapped Token">
        <h2
          css={`
            ${textStyle('title4')};
            display: flex;
            justify-content: space-between;
          `}
        >
          <TokenBadge
            compact
            address={depositedToken.address}
            network={network && network.type}
            symbol={depositedToken.symbol}
          />
          <span>
            <img src={wrap} />
          </span>
          <TokenBadge
            compact
            address={wrappedToken.address}
            network={network && network.type}
            symbol={wrappedToken.symbol}
          />
        </h2>
        <p
          css={`
            margin-top: ${1 * GU}px;
          `}
        >
          You can wrap{' '}
          <TokenBadge
            compact
            address={depositedToken.address}
            network={network && network.type}
            symbol={depositedToken.symbol}
          />{' '}
          tokens for{' '}
          <TokenBadge
            compact
            address={wrappedToken.address}
            network={network && network.type}
            symbol={wrappedToken.symbol}
          />{' '}
          tokens used in this organization for governance.
        </p>
        <p
          css={`
            margin-top: ${1 * GU}px;
          `}
        >
          You can unwrap{' '}
          <TokenBadge
            compact
            address={wrappedToken.address}
            network={network && network.type}
            symbol={wrappedToken.symbol}
          />{' '}
          at any time to return your original tokens.
        </p>
        <p
          css={`
            margin-top: ${1 * GU}px;
          `}
        >
          1 {depositedToken.symbol} = 1 {wrappedToken.symbol}
        </p>
      </Box>
      <Box heading="Token Info">
        <ul>
          {[
            ['Wrapped supply', totalSupply],
            ['Transferable', <span css={'text-transform: uppercase'}>no</span>],
            [
              'Token',
              <TokenBadge
                address={wrappedToken.address}
                name={wrappedToken.name}
                network={network && network.type}
                symbol={wrappedToken.symbol}
              />,
            ],
          ].map(([label, content], index) => (
            <li
              key={index}
              css={`
                display: flex;
                justify-content: space-between;
                list-style: none;
                color: ${theme.surfaceContent};

                & + & {
                  margin-top: ${2 * GU}px;
                }

                > span:nth-child(1) {
                  color: ${theme.surfaceContentSecondary};
                }
                > span:nth-child(2) {
                  // “:” is here for accessibility reasons, we can hide it
                  opacity: 0;
                  width: 10px;
                }
                > span:nth-child(3) {
                  flex-shrink: 1;
                }
              `}
            >
              <span>{label}</span>
              <span>:</span>
              {content}
            </li>
          ))}
        </ul>
      </Box>
    </React.Fragment>
  )
}

export default InfoBox
