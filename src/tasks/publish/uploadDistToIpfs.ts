import IpfsHttpClient from 'ipfs-http-client'
import readIgnoreFiles from './readIgnoreFiles'
const { globSource } = IpfsHttpClient

const defaultIpfsProvider = 'http://localhost:5001'

interface Cid {
  version: number
  codec: string
  multihash: Buffer
  multibaseName: string
  toString: () => string
}

interface IpfsAddResult {
  path: string
  size: number
  cid: Cid
}

/**
 * Uploads dist folder to IPFS
 * Applies various ignore patterns:
 * - .ipfsignore
 * - .gitignore
 */
export default async function uploadReleaseToIpfs(
  distPath: string,
  options?: {
    ipfsProvider?: string
    rootPath?: string
    ignorePatterns?: string[]
    progress?: (totalBytes: number) => void
  }
): Promise<string> {
  const { ipfsProvider, rootPath, ignorePatterns, progress } = options || {}
  const ipfs = IpfsHttpClient(ipfsProvider || defaultIpfsProvider)

  const ignore: string[] = []
  if (Array.isArray(ignorePatterns)) ignore.push(...ignorePatterns)
  if (rootPath) ignore.push(...readIgnoreFiles(rootPath))

  const results: IpfsAddResult[] = []
  for await (const entry of ipfs.add(
    globSource(distPath, { recursive: true, ignore }),
    { progress }
  )) {
    results.push(entry)
  }
  const rootDir = results[results.length - 1]
  return rootDir.cid.toString()
}
