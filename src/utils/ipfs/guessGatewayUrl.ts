import { uniq } from 'lodash'
import fetch from 'node-fetch'
import { urlJoin, parseUrlSafe } from '~/src/utils/url'

/**
 * Returns a URL that may have a given content hash already available
 * Use after publish to guess at which gateway URL the recently uploaded
 * content is already available
 *
 * Possible gateway routes given a URL exposing an IPFS node are
 * - mynode.io/ipfs/Qm...
 * - mynode.io:8080/ipfs/Qm...
 * - mynode.io:5001/ipfs/Qm...
 */
export async function guessGatewayUrl({
  ipfsApiUrl,
  contentHash,
  ipfsGateway
}: {
  ipfsApiUrl: string
  contentHash: string
  ipfsGateway?: string
}): Promise<string | null> {
  const urls = getPossibleGatewayUrls({ ipfsApiUrl, ipfsGateway })
  try {
    return await oneSuccess<string>(
      urls.map(async url => {
        const testUrl = urlJoin(url, 'ipfs', contentHash)
        const res = await fetch(testUrl, { timeout: 3000 })
        // node-fetch does not throw on error status codes
        if (!res.ok) throw Error(`Not ok ${res.statusText}`)
        await res.text()
        // If the request succeeds, return the url to be used as gateway
        return url
      })
    )
  } catch (e) {
    // No Gateway URL works
    return null
  }
}

/**
 * Aggregate a list of possible available gateway URLs given an API url and gateway
 * - Some gateways are exposed in port 80 or 8080
 * - The IPFS API has a gateway route, but it is closed in Infura's for example
 * @return possibleGatewayUrls = [
 *   'http://mynode.io/',
 *   'http://mynode.io:5001/',
 *   'http://mynode.io:6001/',
 *   'http://mynode.io:8080/',
 *   'https://ipfs.io'
 * ]
 */
export function getPossibleGatewayUrls({
  ipfsApiUrl,
  ipfsGateway
}: {
  ipfsApiUrl: string
  ipfsGateway?: string
}): string[] {
  const possibleUrls: string[] = []

  const ipfsApiUrlParsed = parseUrlSafe(ipfsApiUrl)
  // Add after parsing to ensure same formating
  possibleUrls.push(ipfsApiUrlParsed.toString())
  for (const port of ['', '5001', '8080']) {
    ipfsApiUrlParsed.port = port
    possibleUrls.push(ipfsApiUrlParsed.toString())
  }

  if (ipfsGateway) possibleUrls.push(ipfsGateway)

  return uniq(possibleUrls).sort()
}

/**
 * From https://stackoverflow.com/questions/37234191/how-do-you-implement-a-racetosuccess-helper-given-a-list-of-promises
 * @param promises
 */
function oneSuccess<T>(promises: Promise<T>[]): Promise<T> {
  return Promise.all(
    promises.map(async p => {
      // If a request fails, count that as a resolution so it will keep
      // waiting for other possible successes. If a request succeeds,
      // treat it as a rejection so Promise.all immediately bails out.
      return p.then(
        val => Promise.reject(val),
        err => Promise.resolve(err)
      )
    })
  ).then(
    // If '.all' resolved, we've just got an array of errors.
    errors => Promise.reject(errors),
    // If '.all' rejected, we've got the result we wanted.
    val => Promise.resolve(val)
  )
}
