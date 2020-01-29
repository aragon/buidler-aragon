import { BuidlerConfig, BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'

export interface BuidlerAragonConfig extends BuidlerConfig {
  aragon: AragonConfig
}

export interface AragonConfig {
  appServePort?: number
  clientServePort?: number
  appSrcPath?: string
  appBuildOutputPath?: string
  hooks?: AragonConfigHooks
}

export interface AragonConfigHooks {
  preInit?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void
  postInit?: (bre: BuidlerRuntimeEnvironment) => Promise<void> | void
  getInitParams?: (bre: BuidlerRuntimeEnvironment) => Promise<any[]> | any[]
}

/**
 * arapp.json
 */
export interface AragonAppJson {
  roles: Role[]
  environments: AragonEnvironments
  path: string
}

interface Role {
  name: string
  id: string
  params: string[]
  bytes: string
}

interface AragonEnvironments {
  [environmentName: string]: AragonEnvironment
}

interface AragonEnvironment {
  network: string
  appName: string
  registry: string
  wsRPC: string
}
