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
  /**
   * If the appName is different per network use object form
   * ```ts
   * appName: {
   *   rinkeby: "myapp.open.aragonpm.eth"
   * }
   * ```
   */
  appName?: string | { [network: string]: string }
  hooks?: AragonConfigHooks
}

export interface AragonConfigHooks {
  preDao?: (params: {}, bre: BuidlerRuntimeEnvironment) => Promise<void> | void
  postDao?: (
    params: { dao: KernelInstance },
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  preInit?: (
    params: { proxy: Truffle.ContractInstance },
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  postInit?: (
    params: { proxy: Truffle.ContractInstance },
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
  getInitParams?: (
    params: {},
    bre: BuidlerRuntimeEnvironment
  ) => Promise<any[]> | any[]
  postUpdate?: (
    params: { proxy: Truffle.ContractInstance },
    bre: BuidlerRuntimeEnvironment
  ) => Promise<void> | void
}

export interface IpfsConfig {
  /**
   * To query files such as the artifact of your app's latest version
   * - http://localhost:8080
   * - https://ipfs.io
   */
  ipfsGateway?: string
  /**
   * To add and pin version data
   * - http://localhost:5001
   * - http://ipfs.infura.io
   */
  ipfsApi?: string
}

/**
 * arapp.json
 */

export interface Role {
  name: string // 'Create new payments'
  id: string // 'CREATE_PAYMENTS_ROLE'
  params: string[] //  ['Token address', ... ]
  bytes: string // '0x5de467a460382d13defdc02aacddc9c7d6605d6d4e0b8bd2f70732cae8ea17bc'
}

// The aragon manifest requires the use of camelcase for some names
/* eslint-disable camelcase */
export interface AragonManifest {
  name: string // 'Counter'
  author: string // 'Aragon Association'
  description: string // 'An application for Aragon'
  changelog_url: string // 'https://github.com/aragon/aragon-apps/releases',
  details_url: string // '/meta/details.md'
  source_url: string // 'https://<placeholder-repository-url>'
  icons: {
    src: string // '/meta/icon.svg'
    sizes: string // '56x56'
  }[]
  screenshots: {
    src: string // '/meta/screenshot-1.png'
  }[]
  script: string // '/script.js'
  start_url: string // '/index.html'
}
/* eslint-enable camelcase */

interface AragonArtifactFunction {
  roles: string[]
  sig: string
  /**
   * This field might not be able if the contract does not use
   * conventional solidity syntax and Aragon naming standards
   * null if there in no notice
   */
  notice: string | null
  /**
   * The function's ABI element is included for convenience of the client
   * null if ABI is not found for this signature
   */
  abi: AbiItem | null
}

export interface AragonArtifact extends AragonAppJson {
  roles: Role[]
  abi: AbiItem[]
  /**
   * All publicly accessible functions
   * Includes metadata needed for radspec and transaction pathing
   * initialize() function should also be included for completeness
   */
  functions: AragonArtifactFunction[]
  /**
   * Functions that are no longer available at `version`
   */
  deprecatedFunctions: {
    [version: string]: AragonArtifactFunction[]
  }
  /**
   * The flaten source code of the contracts must be included in
   * any type of release at this path
   */
  flattenedCode: string // "./code.sol"
  appId: string
  appName: string

  // env: AragonEnvironment // DEPRECATED
  // deployment: any // DEPRECATED
  // path: string // DEPRECATED 'contracts/Finance.sol'
  // environments: AragonEnvironments // DEPRECATED
}

export interface AragonAppJson {
  roles: Role[]
  environments: AragonEnvironments
  path: string
  dependencies?: {
    appName: string // 'vault.aragonpm.eth'
    version: string // '^4.0.0'
    initParam: string // '_vault'
    state: string // 'vault'
    requiredPermissions: {
      name: string // 'TRANSFER_ROLE'
      params: string // '*'
    }[]
  }[]
}

export interface AragonEnvironments {
  [environmentName: string]: AragonEnvironment
}

export interface AragonEnvironment {
  network: string
  registry?: string
  appName?: string
  gasPrice?: string
  wsRPC?: string
  appId?: string
}

/**
 * App object returned by the aragon-js wrapper
 */
export interface AragonApp {
  abi: AbiItem[]
  name: string // 'Kernel'
  appName: string // 'kernel.aragonpm.eth'
  roles: any[]
  functions: any[]
  isAragonOsInternalApp: boolean
  proxyAddress: string // '0x76804359E7b668845D209f4a0391D5482a18C476'
  appId: string
  codeAddress: string
  isForwarder: boolean
}

export interface AclPermissions {
  [toAppAddress: string]: {
    [roleHash: string]: {
      allowedEntities: string[]
      manager: string
    }
  }
}

export interface AclPermission {
  to: string // App address '0xbc4d08eb94caf68faf73be40780b68b1de369d15'
  role: string // Role hash '0x0b719b33c83b8e5d300c521cb8b54ae9bd933996a14bef8c2f4e0285d2d2400a'
  allowedEntities: string[] // [ '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7' ]
  manager: string // '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
}
