import { ethers } from 'ethers'
import {
  BuidlerRuntimeEnvironment,
  HttpNetworkConfig
} from '@nomiclabs/buidler/types'
import {
  AppInstallerOptions,
  AppInstaller,
  AppOptions,
  AppInstalled,
  NetworkType
} from '~/src/types'
import { ANY_ADDRESS } from '~/src/params'
import { toApmVersionArray, getRepoVersion } from '~/src/utils/apm'
import { getFullAppName } from '~/src/utils/appName'
import { getLog } from '~/src/utils/getLog'
import { namehash } from '~/src/utils/namehash'
import { APMRegistryInstance, KernelInstance } from '~/typechain'
import assertEnsDomain from './assertEnsDomain'
import getAbiFromContentUri from './getAbiFromContentUri'
import getExternalRepoVersion from './getRepoVersion'
import { getContentHash, utf8ToHex } from './utils'

/**
 * Get an initialized instance of appInstaller
 * @param installerOptions
 * @param bre
 */
/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
export default function AppInstaller(
  installerOptions: AppInstallerOptions,
  bre: BuidlerRuntimeEnvironment
): AppInstaller {
  /**
   * @param name "finance"
   */
  return function appInstaller(
    name: string,
    appOptions?: AppOptions
  ): Promise<AppInstalled> {
    return _installExternalApp(
      { name, ...(appOptions || {}), ...installerOptions },
      bre
    )
  }
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
async function _installExternalApp(
  {
    name,
    version,
    network = 'homestead',
    initializeArgs,
    skipInitialize,
    apmAddress,
    dao,
    ipfsGateway
  }: {
    name: string
    version?: string
    network?: NetworkType
    initializeArgs?: any[]
    skipInitialize?: boolean
    apmAddress: string
    dao: KernelInstance
    ipfsGateway: string
  },
  bre: BuidlerRuntimeEnvironment
) {
  const networkConfig = bre.network.config as HttpNetworkConfig
  const ethersWeb3Provider = new ethers.providers.Web3Provider(
    bre.web3.currentProvider,
    networkConfig.ensAddress && {
      name: bre.network.name,
      chainId: networkConfig.chainId || 8545,
      ensAddress: networkConfig.ensAddress
    }
  )
  const rootAccount: string = (await bre.web3.eth.getAccounts())[0]
  const fullName = getFullAppName(name)

  // We try to resolve ENS name in case of more than one app installation
  const repoAddress: string = await ethersWeb3Provider.resolveName(fullName)

  // If no repo for the app we publish first version otherwise we fetch previous version
  const { contractAddress, contentUri } = repoAddress
    ? await getRepoVersion(fullName, 'latest', ethersWeb3Provider)
    : await _publishApp(network, fullName, rootAccount, version)

  // Install app instance and retrieve proxy address
  const proxyAddress = await dao
    .newAppInstance(namehash(fullName), contractAddress, '0x', false)
    .then(txResponse => getLog(txResponse, 'NewAppProxy', 'proxy'))

  /*
   * Provide utility functions with cached state if the user
   * needs to initialize or create permissions
   *
   * On tests its best to call initialize in two steps
   * so a possible revert will show a better error
   * Also, if the initializeArgs do not match the ABI, web3 will throw
   *
   * Below cached variables prevents fetching the ABI
   * if it's not necessary or fetching twice
   */

  type Proxy = any
  type Acl = any
  let proxy: Proxy | undefined
  let acl: Acl | undefined

  async function _getProxyInstance(): Promise<Proxy> {
    if (!proxy) {
      const appAbi = await getAbiFromContentUri(contentUri, { ipfsGateway })
      proxy = new bre.web3.eth.Contract(appAbi, proxyAddress)
    }
    return proxy
  }

  async function _getAclInstance(): Promise<Acl> {
    if (!acl) {
      const aclAddress = await dao.acl()
      const ACL = bre.artifacts.require('ACL')
      acl = await ACL.at(aclAddress)
    }
    return acl
  }

  async function _publishApp(
    network: string,
    fullName: string,
    rootAccount: string,
    version?: string
  ): Promise<{ contractAddress: string; contentUri: string }> {
    const infuraProvider = new ethers.providers.InfuraProvider(network)
    const etherscanProvider = new ethers.providers.EtherscanProvider(network)

    // Fetch version from external network
    const versionData = await getExternalRepoVersion(
      fullName,
      version,
      infuraProvider
    )
    const { contractAddress, contentURI } = versionData

    // Fetch the deploy transaction from etherscan
    const history = await etherscanProvider.getHistory(contractAddress, 0)
    const deployTx = history[0]

    const newDeployTx = await bre.web3.eth.sendTransaction({
      from: rootAccount,
      data: deployTx.data
    })

    const newContractAddress: string = newDeployTx.contractAddress

    // Todo: construct valid deploy TX from the source code
    // Make sure the contract code is correct before continuing
    const codeNew = await bre.web3.eth.getCode(newContractAddress)
    const codeReal = await infuraProvider.getCode(contractAddress)
    if (codeNew !== codeReal)
      throw Error('Error re-deploying contract code, it is not equal')

    // Create new repo and publish its version
    // Force the client to fetch from this specific ipfsGateway instead of localhost:8080
    const shortName = name.split('.')[0]
    const initialVersionArray = toApmVersionArray('1.0.0')
    const contentUriHttpFromPublicGateway = utf8ToHex(
      `http:${ipfsGateway}${getContentHash(contentURI)}`
    )
    const APMRegistry = bre.artifacts.require('APMRegistry')
    const apmRegistry: APMRegistryInstance = await APMRegistry.at(apmAddress)
    const repoAddress: string = await apmRegistry
      .newRepoWithVersion(
        shortName,
        rootAccount,
        initialVersionArray,
        newContractAddress,
        contentUriHttpFromPublicGateway
      )
      .then(txResponse => getLog(txResponse, 'NewRepo', 'repo'))

    // Make sure the resulting repoAddress is accessible from the client
    await assertEnsDomain(fullName, repoAddress)

    return {
      contractAddress: newContractAddress,
      contentUri: contentURI
    }
  }

  /**
   * Initialize this proxy instance
   */
  async function initialize(_initializeArgs: any[]): Promise<void> {
    const _proxy = await _getProxyInstance()
    await _proxy.methods
      .initialize(..._initializeArgs)
      .send({ from: rootAccount })
  }

  /**
   * Assign a permission of this app to an entity
   * @param roleName 'TRANSFER_ROLE'
   * @param entity "0x615..." if unspecified defaults to ANY_ADDRESS
   */
  async function createPermission(
    roleName: string,
    entity = ANY_ADDRESS
  ): Promise<void> {
    const _proxy = await _getProxyInstance()
    const _acl = await _getAclInstance()
    const roleId = await _proxy.methods[roleName]().call()
    await _acl.createPermission(entity, proxyAddress, roleId, rootAccount, {
      from: rootAccount
    })
  }

  if (!skipInitialize) {
    await initialize(initializeArgs || [])
  }

  return {
    initialize,
    createPermission,
    address: proxyAddress
  }
}
