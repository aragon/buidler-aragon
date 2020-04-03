import { assert } from 'chai'
import { guessGatewayUrl, getPossibleGatewayUrls } from '~/src/utils/ipfs'
import { infuraIpfsApiUrl } from '~/test/testParams'

describe('guessGatewayUrl', () => {
  describe('getPossibleGatewayUrls', () => {
    it('Should return list of possible gateway urls', () => {
      const ipfsApiUrl = 'http://mynode.io:6001'
      const ipfsGateway = 'https://ipfs.io'
      const urls = getPossibleGatewayUrls({ ipfsApiUrl, ipfsGateway })
      assert.deepEqual(urls, [
        'http://mynode.io/',
        'http://mynode.io:5001/',
        'http://mynode.io:6001/',
        'http://mynode.io:8080/',
        'https://ipfs.io'
      ])
    })
  })

  describe('guessGatewayUrl', () => {
    it('Should return the available gateway', async () => {
      const ipfsApiUrl = infuraIpfsApiUrl
      const ipfsGateway = 'https://wrong.io'
      const contentHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/about'
      const url = await guessGatewayUrl({
        ipfsApiUrl,
        ipfsGateway,
        contentHash
      })
      assert.equal(url, 'https://ipfs.infura.io/')
    })
  })
})
