import React from 'react'
import PropTypes from 'prop-types'
import { Button, EmptyStateCard, GU, LoadingRing } from '@aragon/ui'
import emptyStateImg from '../assets/empty-state.png'

const NoWrappedTokens = React.memo(function NoWrappedTokens({
  isSyncing,
  onWrapTokens,
}) {
  return (
    <React.Fragment>
      <EmptyStateCard
        css={`
          width: 100%;
          height: 600px;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
        text={
          isSyncing ? (
            <div
              css={`
                display: grid;
                align-items: center;
                justify-content: center;
                grid-template-columns: auto auto;
                grid-gap: ${1 * GU}px;
              `}
            >
              <LoadingRing />
              <span>Syncing…</span>
            </div>
          ) : (
            <div
              css={`
                margin: ${3 * GU}px 0;
              `}
            >
              No wrapped tokens yet!
            </div>
          )
        }
        action={
          onWrapTokens && (
            <Button wide mode="strong" onClick={onWrapTokens}>
              Wrap tokens
            </Button>
          )
        }
        illustration={
          <img
            css={`
              margin: auto;
              height: 170px;
            `}
            src={emptyStateImg}
            alt="No wrapped tokens yet"
          />
        }
      />
    </React.Fragment>
  )
})
NoWrappedTokens.propTypes = {
  isSyncing: PropTypes.bool,
  onWrapTokens: PropTypes.func,
}

export default NoWrappedTokens
