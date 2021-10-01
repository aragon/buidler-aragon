import { create, globSource } from 'ipfs-http-client'
import path from 'path'


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
export async function uploadDirToIpfs({
  dirPath,
  ipfsApiUrl,
  ignore,
  progress
}: {
  dirPath: string
  ipfsApiUrl: string
  ignore?: string[]
  progress?: (totalBytes: number) => void
}): Promise<string> {
  // @ts-ignore
  const ipfs = create(ipfsApiUrl)

  // @ts-ignore
  const root = await ipfs.add(globSource(dirPath, { recursive: true, ignore }))

  return root.cid.toString()

}
