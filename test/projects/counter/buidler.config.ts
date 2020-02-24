import { usePlugin } from '@nomiclabs/buidler/config'
import { aragenAccounts } from '../../../src/params'

usePlugin('@nomiclabs/buidler-truffle5')
usePlugin('@nomiclabs/buidler-web3')

// Specially load the buidler-aragon plugin for testing here.
// Normally would use `usePlugin(@aragon/buidler-aragon)`.
import { loadPluginFile } from '@nomiclabs/buidler/plugins-testing'
loadPluginFile(__dirname + '/../../../src/index')
import { BuidlerAragonConfig } from '../../../src/types'

const config: BuidlerAragonConfig = {
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      accounts: aragenAccounts
    },
    someothernetwork: {
      url: 'http://localhost:8546'
    }
  },
  solc: {
    version: '0.4.24'
  }
  // Note: Intentionally not specifying aragon: AragonConfig.
}

export default config
