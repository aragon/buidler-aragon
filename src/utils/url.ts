/**
 * Joins multiple url parts safely
 * - Does not break the protocol double slash //
 * - Cleans double slashes at any point
 * @param args ("http://ipfs.io", "ipfs", "Qm")
 * @return "http://ipfs.io/ipfs/Qm"
 */
export function urlJoin(...args: string[]): string {
  return args.join('/').replace(/([^:]\/)\/+/g, '$1')
}

/**
 * Wrapps the URL module and accepts urls without a protocol
 * assumes HTTP
 * @param url
 */
export function parseUrlSafe(url: string): URL {
  try {
    return new URL(url)
  } catch (e) {
    if (!url.includes('://')) {
      return new URL('http://' + url)
    }
    throw e
  }
}
