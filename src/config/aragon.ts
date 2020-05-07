import { ConfigExtender } from '@nomiclabs/buidler/types'
import { AragonConfig } from '~/src/types'
import { defaultIpfsGateway } from '~/src/params'

export const defaultAragonConfig: AragonConfig = {
  appServePort: 8001,
  clientServePort: 3000,
  appBuildOutputPath: 'dist/',
  ignoreFilesPath: '.',
  ipfsGateway: defaultIpfsGateway
}

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  // Apply defaults
  finalConfig.aragon = {
    ...defaultAragonConfig,
    ...(userConfig.aragon || {})
  }
}
