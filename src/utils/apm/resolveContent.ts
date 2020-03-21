import fetch from 'node-fetch'
import { contentUriToFetchUrl } from './utils'
import { AragonManifest, AragonArtifact } from '~/src/types'

/**
 * Resolve an Aragon app contentUri and return its manifest and artifact
 * @param contentUri "ipfs:Qm..."
 * @param options
 * - ipfsGateway: 'http://localhost:8080' | 'https://my-remote-ipfs.io'
 */
export async function resolveRepoContentUri(
  contentUri: string,
  options?: { ipfsGateway?: string }
): Promise<{ artifact: AragonArtifact; manifest: AragonManifest }> {
  const url = contentUriToFetchUrl(contentUri, options)

  const [manifest, artifact] = await Promise.all([
    _fetchJson<AragonManifest>(`${url}/manifest.json`),
    _fetchJson<AragonArtifact>(`${url}/artifact.json`)
  ])

  return { manifest, artifact }
}

/**
 * Fetch and parse JSON from an HTTP(s) URL
 * @param url
 */
export async function _fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}
