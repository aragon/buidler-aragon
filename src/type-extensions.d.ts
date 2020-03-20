import { AragonConfig, IpfsConfig } from './types'

declare module '@nomiclabs/buidler/types' {
  interface BuidlerConfig {
    aragon?: AragonConfig
    ipfs?: IpfsConfig
  }

  interface HttpNetworkConfig {
    ensAddress?: string
  }
}
