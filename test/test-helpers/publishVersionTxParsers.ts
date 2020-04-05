import { PublishVersionTxData } from '~/src/utils/apm'

/**
 * Test utility to parse tx data params
 * @param txData
 */
export function parseNewVersionTxData(
  txData: PublishVersionTxData
): {
  to: string
  version: string
  contractAddress: string
  contentUri: string
} {
  const { to, methodName, params } = txData
  if (methodName !== 'newVersion') throw Error(`methodName must be newVersion`)
  const [versionArray, contractAddress, contentUri] = params
  return {
    to,
    version: versionArray.join('.'),
    contractAddress,
    contentUri
  }
}

/**
 * Test utility to parse tx data params
 * @param txData
 */
export function parseNewRepoWithVersionTxData(
  txData: PublishVersionTxData
): {
  to: string
  shortName: string
  managerAddress: string
  version: string
  contractAddress: string
  contentUri: string
} {
  const { to, methodName, params } = txData
  if (methodName !== 'newRepoWithVersion')
    throw Error(`methodName must be newRepoWithVersion`)
  const [
    shortName,
    managerAddress,
    versionArray,
    contractAddress,
    contentUri
  ] = params
  return {
    to,
    shortName,
    managerAddress,
    version: versionArray.join('.'),
    contractAddress,
    contentUri
  }
}
