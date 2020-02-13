import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { createEns } from './ens'
import { createApm } from './apm'
import { createDaoFactory } from './dao'
import { defaultLocalAragonBases } from '../../../../params'
import * as Ui from '../../ui/ui'

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
export default async function deployAragonBases(
  bre: BuidlerRuntimeEnvironment
): Promise<AragonBases> | never {
  // First, aggregate which bases are deployed and which not
  // by checking if code can be found at the expected addresses.
  const isBaseDeployed: { [baseName: string]: boolean } = {}
  for (const [name, address] of Object.entries(defaultLocalAragonBases)) {
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
    const ens = await createEns(bre.web3, bre.artifacts)
    const daoFactory = await createDaoFactory(bre.artifacts)
    const apm = await createApm(bre.web3, bre.artifacts, ens, daoFactory)

    Ui.setInfo({ ensAddress: ens.address, apmAddress: apm.address })

    if (ens.address !== defaultLocalAragonBases.ensAddress)
      throw new Error(
        `ENS was deployed at ${ens.address} instead of the expected local address ${defaultLocalAragonBases.ensAddress}`
      )

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

  return defaultLocalAragonBases
}
