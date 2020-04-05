import { ConfigExtender } from '@nomiclabs/buidler/types'
import { configExtender as configExtenderAragon } from './aragon'
import { configExtender as configExtenderMnemonic } from './mnemonic'
import { configExtender as configExtenderNetworks } from './networks'

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  configExtenderNetworks(finalConfig, userConfig)
  configExtenderMnemonic(finalConfig, userConfig)
  configExtenderAragon(finalConfig, userConfig)
}
