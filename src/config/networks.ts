import {
  ConfigExtender,
  HttpNetworkConfig,
  NetworkConfig,
  Networks
} from '@nomiclabs/buidler/types'
import { defaultLocalAragonBases, aragenMnemonic } from '~/src/params'
import { AragonEnvironment } from '~/src/types'
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

  const mutateNetwork = (
    aragonEnvironment: AragonEnvironment,
    buidlerNetwork: HttpNetworkConfig
  ): HttpNetworkConfig => {
    const mutatedNetwork = Object.assign(
      {},
      buidlerNetwork
    ) as HttpNetworkConfig

    // Append registry address
    if (aragonEnvironment.registry) {
      mutatedNetwork.ensAddress = aragonEnvironment.registry
    }

    return mutatedNetwork
  }

  // Apply networks from arapp.json
  const arapp = readArappIfExists()
  if (arapp && typeof arapp.environments === 'object') {
    for (const [envName, environment] of Object.entries(arapp.environments)) {
      if (environment.network) {
        if (finalConfig.networks[envName]) {
          finalConfig.networks[envName] = mutateNetwork(
            environment,
            finalConfig.networks[envName] as HttpNetworkConfig
          )
        } else if (finalConfig.networks[environment.network]) {
          // Add missing network from arapp.json
          finalConfig.networks[envName] = mutateNetwork(
            environment,
            finalConfig.networks[environment.network] as HttpNetworkConfig
          )
        }
      }
    }
  }
}
