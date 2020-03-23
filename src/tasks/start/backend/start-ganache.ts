import tcpPortUsed from 'tcp-port-used'
import { promisify } from 'util'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { aragenGasLimit, aragenMnemonic, testnetPort } from '~/src/params'

// There's an issue with how web3 exports its typings that conflicts with
// ganache-core imports of those typings. Follow https://github.com/trufflesuite/ganache-core/issues/465
// for upcoming solutions, meanwhile require is used to ignore the types.
/* eslint-disable @typescript-eslint/no-var-requires */
const ganache = require('ganache-core')

let server

export async function startGanache(
  bre: BuidlerRuntimeEnvironment
): Promise<number> {
  if (bre.network.name === 'buidlerevm') {
    throw new BuidlerPluginError(
      'Cannot use buidlerevm network for this task until a JSON RPC is exposed'
    )
  }

  if (bre.network.name !== 'localhost') {
    throw new BuidlerPluginError(
      'This plugin currently requires that the localhost network is used.'
    )
  }

  // If port is in use, assume that a local chain is already running.
  const portInUse = await tcpPortUsed.check(testnetPort)
  if (portInUse) {
    return 0
  }

  // Start a new ganache server.
  server = ganache.server({
    gasLimit: aragenGasLimit,
    mnemonic: aragenMnemonic,
    /* eslint-disable @typescript-eslint/camelcase */
    default_balance_ether: 100
  })
  const blockchain = await promisify(server.listen)(testnetPort)

  return blockchain.options.network_id
}

export function stopGanache(): void {
  if (!server) {
    throw new BuidlerPluginError(
      'Cant stop ganache server because it doesnt seem to be running.'
    )
  }

  server.close()
}
