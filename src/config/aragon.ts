import { ConfigExtender } from '@nomiclabs/buidler/types'
import { AragonConfig } from '~/src/types'

export const defaultAragonConfig: AragonConfig = {
  appServePort: 8001,
  clientServePort: 3000,
  appSrcPath: 'app/',
  appBuildOutputPath: 'dist/',
  ignoreFilesPath: '.',
  ipfsGateway: 'https://ipfs.eth.aragon.network/ipfs/'
}

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  // Apply defaults
  finalConfig.aragon = {
    ...defaultAragonConfig,
    ...(userConfig.aragon || {})
  }
}
