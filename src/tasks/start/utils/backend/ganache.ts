import tcpPortUsed from 'tcp-port-used'
import { promisify } from 'util'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { logBack } from '../logger'
import { aragenGasLimit, aragenMnemonic, testnetPort } from '~/src/params'

// There's an issue with how web3 exports its typings that conflicts with
// ganache-core imports of those typings. Follow https://github.com/trufflesuite/ganache-core/issues/465
// for upcoming solutions, meanwhile require is used to ignore the types
/* eslint-disable @typescript-eslint/no-var-requires */
const ganache = require('ganache-core')

const buidlerevmNetworkName = 'buidlerevm'

export async function startGanache(
  bre: BuidlerRuntimeEnvironment
): Promise<void> {
  if (bre.network.name === buidlerevmNetworkName) {
    throw new BuidlerPluginError(
      `Cannot use ${buidlerevmNetworkName} network for this task until a JSON RPC is exposed`
    )
  } else if (bre.network.name === 'localhost') {
    if (await tcpPortUsed.check(testnetPort)) {
      logBack(`Connecting to existing local blockchain instance`)
    } else {
      logBack(`Starting a new Ganache testnet instance`)
      const server = ganache.server({
        gasLimit: aragenGasLimit,
        mnemonic: aragenMnemonic
      })
      const blockchain = await promisify(server.listen)(testnetPort)
      logBack(
        `New Ganache instance ready, id: ${blockchain.options.network_id}`
      )
    }
  }
}
