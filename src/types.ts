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
  ipfsGateway?: string
  hooks?: AragonConfigHooks
}

type AragonHook<T, R> = (
  params: T & { log: (message: string) => void },
  bre: BuidlerRuntimeEnvironment
) => Promise<R> | R

export interface AragonConfigHooks {
  preDao?: AragonHook<{}, void>
  postDao?: AragonHook<{ dao: KernelInstance }, void>
  preInit?: AragonHook<
    { proxy: Truffle.ContractInstance; appInstaller: AppInstaller },
    void
  >
  postInit?: AragonHook<
    { proxy: Truffle.ContractInstance; appInstaller: AppInstaller },
    void
  >
  getInitParams?: AragonHook<{}, any[]>
  postUpdate?: AragonHook<{ proxy: Truffle.ContractInstance }, void>
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

/**
 * App Installer types
 */

export type NetworkType =
  | 'homestead'
  | 'rinkeby'
  | 'ropsten'
  | 'kovan'
  | 'goerli'

export type AppInstaller = (
  name: string,
  appOptions?: AppOptions
) => Promise<AppInstalled>

export interface AppInstalled {
  initialize: (_initializeArgs: any[]) => Promise<void>
  createPermission: (roleName: string, entity?: string) => Promise<void>
  address: string
}

export interface AppOptions {
  version?: string
  initializeArgs?: any[]
  skipInitialize?: boolean
  network?: NetworkType
}

export interface AppInstallerOptions {
  apmAddress: string
  dao: KernelInstance
  ipfsGateway: string
}
