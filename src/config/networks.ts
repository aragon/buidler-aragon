import {
  ConfigExtender,
  HttpNetworkConfig,
  NetworkConfig,
  Networks
} from '@nomiclabs/buidler/types'
import { defaultLocalAragonBases, aragenMnemonic } from '~/src/params'
import { readArappIfExists } from '~/src/utils/arappUtils'

const aragonRpc = (network: string): string =>
  `https://${network}.eth.aragon.network`
const localRpc = 'http://localhost:8545'
const coverageRpc = 'http://localhost:8555'
const frameRpc = 'http://localhost:1248'
const frameOrigin = 'BuidlerAragon'

const aragenNetwork: NetworkConfig = {
  url: localRpc,
  gas: 6.9e6,
  ensAddress: defaultLocalAragonBases.ensAddress,
  accounts: { mnemonic: aragenMnemonic }
}

const defaultNetworks: Networks = {
  // Local networks
  development: aragenNetwork,
  localhost: aragenNetwork,
  aragen: aragenNetwork,
  rpc: aragenNetwork,
  devnet: aragenNetwork,

  // External networks
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
  coverage: {
    url: coverageRpc,
    gas: 0xffffffffff,
    gasPrice: 0x01
  },
  frame: {
    url: frameRpc,
    httpHeaders: { origin: frameOrigin }
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
      if (finalConfig.networks[networkName]) {
        const finalNetwork = finalConfig.networks[
          networkName
        ] as HttpNetworkConfig

        // Append registry address
        if (network.registry) {
          finalNetwork.ensAddress = network.registry
        }
      } else if (network.network && finalConfig.networks[network.network]) {
        finalConfig.networks[networkName] = {
          ...finalConfig.networks[network.network],
          ...(network.registry ? { ensAddress: network.registry } : {})
        }
      }
    }
  }
}
