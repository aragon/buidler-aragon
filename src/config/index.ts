import { ConfigExtender } from '@nomiclabs/buidler/types'
import { configExtender as configExtenderMnemonic } from './mnemonic'
import { configExtender as configExtenderNetworks } from './networks'
import { configExtender as configExtenderAragon } from './aragon'

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  configExtenderNetworks(finalConfig, userConfig)
  configExtenderMnemonic(finalConfig, userConfig)
  configExtenderAragon(finalConfig, userConfig)
}
