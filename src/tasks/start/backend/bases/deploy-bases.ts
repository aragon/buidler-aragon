import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { externalArtifactPaths } from '~/src/params'
import { DeployedAddresses } from '~/src/types'
import { copyExternalArtifacts } from '~/src/utils/copyExternalArtifacts'
import { deployApm } from './deploy-apm'
import { deployDaoFactory } from './deploy-dao-factory'
import { deployEns } from './deploy-ens'

interface AragonBases {
  ensAddress: string
  daoFactoryAddress: string
  apmAddress: string
}

/**
 * Deploys the basic Aragon arquitecture bases if necessary.
 * @param bre
 * @return Object of Aragon base addresses
 */
export default async function deployBases(
  bre: BuidlerRuntimeEnvironment
): Promise<AragonBases> {
  // ==================== Temporal hack >>>
  // Copy external artifacts to the local artifacts folder
  // This is a temporary hack until multiple artifacts paths are allowed
  for (const externalArtifactPath of externalArtifactPaths)
    copyExternalArtifacts(externalArtifactPath)
  // ==================== Temporal hack <<<

  const deployedAddresses = bre.config.aragon
    ?.deployedAddresses as DeployedAddresses
  // First, aggregate which bases are deployed and which not
  // by checking if code can be found at the expected addresses.
  const isBaseDeployed: { [baseName: string]: boolean } = {}
  for (const [name, address] of Object.entries(deployedAddresses)) {
    const baseContractCode = await bre.web3.eth.getCode(address)
    // parseInt("0x") = NaN (falsy), parseInt("0x0") = 0 (falsy)
    isBaseDeployed[name] = Boolean(parseInt(baseContractCode))
  }

  // Check if all, none, or some bases are deployed.
  const basesDeployed = Object.values(isBaseDeployed)
  const allBasesAreDeployed = basesDeployed.every(isDeployed => isDeployed)
  const noBasesAreDeployed = basesDeployed.every(isDeployed => !isDeployed)

  // If *all*  bases are deployed => do nothing,
  //    *no*   bases are deployed => deploy them,
  //    *some* bases are deployed => throw an error.
  if (noBasesAreDeployed) {
    const ens = await deployEns(bre, bre.artifacts)
    const daoFactory = await deployDaoFactory(bre.artifacts)
    const apm = await deployApm(bre, bre.artifacts, ens, daoFactory)

    return {
      ensAddress: ens.address,
      daoFactoryAddress: daoFactory.address,
      apmAddress: apm.address
    }
  } else if (!allBasesAreDeployed) {
    throw new BuidlerPluginError(
      `Only some Aragon bases are deployed in the current testnet. Restart its state and retry`
    )
  }

  return {
    ensAddress: deployedAddresses.ens,
    daoFactoryAddress: deployedAddresses.daoFactory,
    apmAddress: deployedAddresses.apm
  }
}
