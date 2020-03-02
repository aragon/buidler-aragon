import IpfsHttpClient from 'ipfs-http-client'
import all from 'it-all'
import readIgnoreFiles from './readIgnoreFiles'
const { globSource } = IpfsHttpClient

const defaultIpfsProvider = 'http://localhost:5001'

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

  const results = await all(
    ipfs.add(globSource(distPath, { recursive: true, ignore }), { progress })
  )
  const rootDir = results[results.length - 1]
  return rootDir.cid.toString()
}
