import { ConfigExtender } from '@nomiclabs/buidler/types'
import { AragonConfig } from '../types'

export const defaultAragonConfig: AragonConfig = {
  appServePort: 8001,
  clientServePort: 3000,
  appSrcPath: 'app/',
  appBuildOutputPath: 'dist/'
}

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  finalConfig.aragon = {
    ...defaultAragonConfig,
    ...userConfig.aragon
  }
}
