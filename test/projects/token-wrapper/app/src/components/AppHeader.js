import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Header,
  IconPlus,
  Tag,
  textStyle,
  useLayout,
  useTheme,
  GU,
} from '@aragon/ui'

const AppHeader = React.memo(function AppHeader({ tokenSymbol, onWrapHolder }) {
  const theme = useTheme()
  const { layoutName } = useLayout()

  return (
    <Header
      primary={
        <div
          css={`
            display: flex;
            align-items: center;
            flex: 1 1 auto;
            width: 0;
          `}
        >
          <h1
            css={`
              ${textStyle(layoutName === 'small' ? 'title3' : 'title2')};
              flex: 0 1 auto;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: ${theme.content};
              margin-right: ${1 * GU}px;
            `}
          >
            Token Wrapper
          </h1>
          <div css="flex-shrink: 0">
            {tokenSymbol && <Tag mode="identifier">{tokenSymbol}</Tag>}
          </div>
        </div>
      }
      secondary={
        onWrapHolder && (
          <Button
            mode="strong"
            label="Wrap tokens"
            icon={<IconPlus />}
            onClick={onWrapHolder}
            display={layoutName === 'small' ? 'icon' : 'label'}
          />
        )
      }
    />
  )
})
AppHeader.propTypes = {
  onWrapHolder: PropTypes.func,
  tokenSymbol: PropTypes.string,
}

export default AppHeader
