import { ethers } from 'ethers'
import { getFullAppName } from '~/src/utils/appName'
import { toApmVersionArray } from '~/src/utils/apm'

const ApmRepoAbi = [
  'function getLatest() public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)',
  'function getBySemanticVersion(uint16[3] _semanticVersion) public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)'
]

/**
 * Fetches APM Repo version from external network
 * @param name "finance.aragonpm.eth"
 * @param version "2.0.0"
 * @param provider ethers provider connected to an external network
 */
export default async function getExternalRepoVersion(
  name: string,
  version: string | undefined,
  provider: ethers.providers.Provider
): Promise<{ contentURI: string; contractAddress: string }> {
  const contract = new ethers.Contract(
    getFullAppName(name),
    ApmRepoAbi,
    provider
  )
  const { contentURI, contractAddress } = version
    ? await contract.getBySemanticVersion(toApmVersionArray(version))
    : await contract.getLatest()

  // throws an error in the event it is not an address
  ethers.utils.getAddress(contractAddress)
  if (!contentURI) throw Error('version data contentURI is not defined')

  return { contentURI, contractAddress }
}
