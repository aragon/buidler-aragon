import {
  BuidlerConfig,
  BuidlerRuntimeEnvironment
} from '@nomiclabs/buidler/types'
import { AbiItem as AbiItemFromWeb3 } from 'web3-utils'
import { KernelInstance } from '~/typechain'

export type AbiItem = AbiItemFromWeb3

export interface BuidlerAragonConfig extends BuidlerConfig {
  aragon?: AragonConfig
}

export interface AragonConfig {
  appServePort?: number
  clientServePort?: number
  appSrcPath?: string
  appBuildOutputPath?: string
  hooks?: AragonConfigHooks
}

export interface AragonConfigHooks {
  preDao?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void
  postDao?: (
    dao: KernelInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  preInit?: (
    proxy: Truffle.ContractInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  postInit?: (
    proxy: Truffle.ContractInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  getInitParams?: (bre: BuidlerRuntimeEnvironment) => Promise<any[]> | any[]
  postUpdate?: (
    proxy: Truffle.ContractInstance,
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
}

/**
 * arapp.json
 */
export interface AragonAppJson {
  roles: Role[]
  environments: AragonEnvironments
  path: string
}

export interface Role {
  name: string
  id: string
  params: string[]
  bytes: string
}

export interface AragonEnvironments {
  [environmentName: string]: AragonEnvironment
}

interface AragonEnvironment {
  network: string
  appName: string
  registry: string
  wsRPC: string
}
