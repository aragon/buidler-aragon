import { ConfigExtender, HttpNetworkConfig } from '@nomiclabs/buidler/types'
import { Networks } from '@nomiclabs/buidler/types'
import { readArappIfExists } from '../utils/arappUtils'

const aragonRpc = (network: string): string =>
  `https://${network}.eth.aragon.network`
const localRpc = 'http://localhost:8545'
const coverageRpc = 'http://localhost:8555'
const frameRpc = 'ws://localhost:1248'

const defaultNetworks: Networks = {
  rpc: {
    chainId: 15,
    url: localRpc,
    gas: 6.9e6,
    gasPrice: 15000000001
  },
  devnet: {
    chainId: 16,
    url: localRpc,
    gas: 6.9e6,
    gasPrice: 15000000001
  },
  mainnet: {
    chainId: 1,
    url: aragonRpc('mainnet'),
    gas: 7.9e6,
    gasPrice: 3000000001
  },
  ropsten: {
    chainId: 3,
    url: aragonRpc('ropsten'),
    gas: 4.712e6
  },
  rinkeby: {
    chainId: 4,
    url: aragonRpc('rinkeby'),
    gas: 6.9e6,
    gasPrice: 15000000001
  },
  kovan: {
    chainId: 42,
    url: aragonRpc('kovan'),
    gas: 6.9e6
  },
  coverage: {
    url: coverageRpc,
    gas: 0xffffffffff,
    gasPrice: 0x01
  },
  development: {
    url: localRpc,
    gas: 6.9e6,
    gasPrice: 15000000001
  },
  frame: {
    url: frameRpc
  }
}

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  // Apply defaults. Note networks may not exists in finalConfig
  for (const [networkName, network] of Object.entries(defaultNetworks)) {
    finalConfig.networks[networkName] = {
      ...network,
      ...((userConfig.networks || {})[networkName] || {}),
      // Add finalConfig in case a previous configExtender has modified it
      ...((finalConfig.networks || {})[networkName] || {})
    } as HttpNetworkConfig
  }

  // Apply networks from arapp.json
  const arapp = readArappIfExists()
  if (arapp && typeof arapp.environments === 'object') {
    for (const [networkName, network] of Object.entries(arapp.environments)) {
      if (network.network && finalConfig.networks[network.network]) {
        const finalNetwork = finalConfig.networks[
          network.network
        ] as HttpNetworkConfig

        // Append registry address
        if (network.registry) {
          finalNetwork.ensAddress = network.registry
        }

        // Create an alias of the declared network to an existing network
        if (network.network !== networkName)
          finalConfig.networks[networkName] = finalNetwork
      }
    }
  }
}
