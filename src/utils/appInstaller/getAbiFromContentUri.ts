import { AbiItem, AragonArtifact } from '~/src/types'
import { resolveRepoContentUriFile } from '~/src/utils/apm'

/**
 * Gets the ABI from an Aragon App release directory
 * @param contentURI
 * @param options
 */
export default async function getAbiFromContentUri(
  contentURI: string,
  options: { ipfsGateway: string }
): Promise<AbiItem[]> {
  const artifact: AragonArtifact = await resolveRepoContentUriFile(
    contentURI,
    'artifact.json',
    options
  ).then(JSON.parse)

  if (!artifact.abi) throw Error('artifact.json does not contain the ABI')
  return artifact.abi
}
