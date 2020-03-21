import { assert } from 'chai'
import {
  parseApmVersionReturn,
  toApmVersionArray,
  stipIpfsPrefix,
  contentUriToFetchUrl,
  toContentUri,
  isAddress,
  utf8ToHex,
  ApmVersion
} from '~/src/utils/apm'
import { zeroAddress } from '~/src/params'

describe('apm > utils', () => {
  const hash = 'QmWWNkXdGDnTaxAxw6vtCM21SDJeWLyaoUzDb3skYXynmo'
  const contentUriHex =
    '0x697066733a516d57574e6b586447446e546178417877367674434d323153444a65574c79616f557a446233736b5958796e6d6f'
  const contentUri = 'ipfs:QmWWNkXdGDnTaxAxw6vtCM21SDJeWLyaoUzDb3skYXynmo'
  const contractAddress = '0xe583D4d74A50F3394AD92597F86277289B159934'

  describe('parseApmVersionReturn', () => {
    it('Should parse a normal version return', () => {
      const apmVersionReturn = {
        0: [1, 0, 0],
        1: contractAddress,
        2: contentUriHex,
        semanticVersion: [1, 0, 0],
        contractAddress,
        contentURI: contentUriHex
      }

      const expectedVersionData: ApmVersion = {
        version: '1.0.0',
        contractAddress,
        contentUri
      }

      const versionData = parseApmVersionReturn(apmVersionReturn)
      assert.deepEqual(versionData, expectedVersionData, 'wrong version data')
    })
  })

  describe('toApmVersionArray', () => {
    it('Should return a semver version array', () => {
      assert.deepEqual(toApmVersionArray('1.0.0'), [1, 0, 0])
    })
  })

  describe('stipIpfsPrefix', () => {
    const testCases = [
      ['http://ipfs.io/ipfs/', 'http://ipfs.io'],
      [contentUri, hash],
      [`ipfs/${hash}`, hash],
      [`/ipfs/${hash}`, hash]
    ]
    for (const [from, to] of testCases)
      it(`Should remove the prefix or suffix of ${from}`, () => {
        assert.equal(stipIpfsPrefix(from), to)
      })
  })

  describe('contentUriToFetchUrl', () => {
    const ipfsGateway = 'http://ipfs.io'
    const testCases = [
      ['http:http://localhost:8080', 'http://localhost:8080'],
      ['http://localhost:8080', 'http://localhost:8080'],
      ['https://remote.app', 'https://remote.app'],
      [`ipfs:${hash}`, `http://ipfs.io/ipfs/${hash}`],
      [`ipfs/${hash}`, `http://ipfs.io/ipfs/${hash}`]
    ]
    for (const [contentUri, fetchUrl] of testCases)
      it(`Should get a fetch url for contentURI ${contentUri}`, () => {
        assert.equal(
          contentUriToFetchUrl(contentUri, { ipfsGateway }),
          fetchUrl
        )
      })
  })

  describe('toContentUri', () => {
    const testCases: {
      protocol: 'http' | 'https' | 'ipfs'
      location: string
      contentUri: string
    }[] = [
      {
        protocol: 'ipfs',
        location: hash,
        contentUri: contentUriHex
      },
      {
        protocol: 'http',
        location: 'http://localhost:8080',
        contentUri: '0x687474703a687474703a2f2f6c6f63616c686f73743a38303830'
      }
    ]
    for (const { protocol, location, contentUri } of testCases)
      it(`Should get a contentURI for ${protocol} ${location}`, () => {
        assert.equal(toContentUri(protocol, location), contentUri)
      })
  })

  describe('isAddress', () => {
    const testCases: [string, boolean][] = [
      [contractAddress, true],
      [zeroAddress, true],
      [hash, false],
      ['0x', false]
    ]
    for (const [address, result] of testCases)
      it(`Should check if is address: ${address}`, () => {
        assert.equal(isAddress(address), result)
      })
  })

  describe('utf8ToHex', () => {
    it('Test conversion of utf8 to hex', () => {
      assert.equal(utf8ToHex(contentUri), contentUriHex)
    })
  })
})
