import { extendConfig, usePlugin } from '@nomiclabs/buidler/config'
import path from 'path'
import { configExtender } from './config'

// TODO: Don't use any type below, try to use something like these...
// import { ResolvedBuidlerConfig, BuidlerConfig } from '@nomiclabs/buidler/types'

export default function(): void {
  // Resolve tsconfig-paths at runtime.
  require('../bootstrap-paths.js')

  // Plugin dependencies.
  usePlugin('@nomiclabs/buidler-truffle5')
  usePlugin('@nomiclabs/buidler-web3')
  usePlugin('@nomiclabs/buidler-etherscan')

  // Task definitions.
  require(path.join(__dirname, '/tasks/start-task'))
  require(path.join(__dirname, '/tasks/publish'))

  // Environment extensions.
  // No extensions atm.

  // Default configuration values.
  extendConfig(configExtender)
}
