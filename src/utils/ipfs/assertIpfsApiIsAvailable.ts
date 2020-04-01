import IpfsHttpClient from 'ipfs-http-client'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'

/**
 * Sanity check to check if an IPFS API is active
 * Note: It requires the API to /api/v0/version route available
 */
export async function assertIpfsApiIsAvailable(
  ipfsApiUrl: string
): Promise<void> {
  const ipfs = IpfsHttpClient(ipfsApiUrl)
  try {
    await ipfs.version()
  } catch (e) {
    throw new BuidlerPluginError(`IPFS API at ${ipfsApiUrl} is not available`)
  }
}
