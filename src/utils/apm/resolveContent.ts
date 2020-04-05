import fetch from 'node-fetch'
import { urlJoin } from '~/src/utils/url'
import { AragonManifest, AragonArtifact } from '~/src/types'
import { contentUriToFetchUrl, toUtf8IfHex } from './utils'

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
  const url = contentUriToFetchUrl(toUtf8IfHex(contentUri), options)

  const [manifest, artifact] = await Promise.all([
    _fetchJson<AragonManifest>(urlJoin(url, 'manifest.json')),
    _fetchJson<AragonArtifact>(urlJoin(url, 'artifact.json'))
  ])

  return { manifest, artifact }
}

/**
 * Resolve an Aragon app contentUri and return a single file given it's path
 * @param contentUri "ipfs:Qm..."
 * @param filepath "code.sol"
 * @param options
 * - ipfsGateway: 'http://localhost:8080' | 'https://my-remote-ipfs.io'
 */
export async function resolveRepoContentUriFile(
  contentUri: string,
  filepath: string,
  options?: { ipfsGateway?: string }
): Promise<string> {
  const url = contentUriToFetchUrl(toUtf8IfHex(contentUri), options)
  return await _fetchText(urlJoin(url, filepath))
}

/**
 * Fetch and parse JSON from an HTTP(s) URL
 * @param url
 */
async function _fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}

async function _fetchText(url: string): Promise<string> {
  return fetch(url).then(res => res.text())
}
