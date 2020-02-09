/* eslint-disable-next-line @typescript-eslint/no-var-requires */
import IPFS from 'ipfs-http-client'

const { globSource } = IPFS

/**
 * Uploads a directory to IPFS
 * @param dirPath './dist'
 * @param ignore ['subfolder/to/ignore/**']
 * @param ipfsProvider 'http://localhost:5001'
 * @return Root directory hash = 'Qm...'
 */
export default async function uploadDirToIpfs(
  dirPath: string,
  ignoreGlobs: string[],
  ipfsProvider: string
): Promise<string> {
  const ipfs = new IPFS(ipfsProvider)

  const showProgress = true
  const progress = (prog: number): void => {
    // Do something with progress
    // console.log(`Uploading... ${prog}`)
  }

  const globOptions = {
    recursive: true,
    ignore: ignoreGlobs
  }

  const addOptions = {
    pin: true,
    ...(showProgress ? { progress } : {})
  }

  const files: { path: string; hash: string }[] = []
  for await (const file of ipfs.add(
    globSource(dirPath, globOptions),
    addOptions
  )) {
    files.push({
      path: file.path,
      hash: file.cid.toString()
    })
  }

  const rootDir = files.pop()
  if (!rootDir) throw Error(`No root entry found: ${JSON.stringify(files)}`)
  return rootDir.hash
}
