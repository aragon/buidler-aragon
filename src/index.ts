import { extendConfig, usePlugin } from '@nomiclabs/buidler/config'
import { configExtender } from './config'
import '../bootstrap-paths'

// TODO: Don't use any type below, try to use something like these...
// import { ResolvedBuidlerConfig, BuidlerConfig } from '@nomiclabs/buidler/types'

export default function(): void {
  // Resolve tsconfig-paths at runtime.
  require('../bootstrap-paths.js')

  // Plugin dependencies.
  usePlugin('@nomiclabs/buidler-truffle5')
  usePlugin('@nomiclabs/buidler-web3')

  // Task definitions.
  // Note: Tasks must be setup in a function. If task() is run in the
  // module body on test teardown the they will not be setup again
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { setupStartTask } = require('./tasks/start-task')
  setupStartTask()
  /* eslint-enable @typescript-eslint/no-var-requires */

  // Environment extensions.
  // No extensions atm.

  // Default configuration values.
  extendConfig(configExtender)
}
