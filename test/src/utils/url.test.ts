import { assert } from 'chai'

import { urlJoin } from '~/src/utils/url'

describe('urlJoin', () => {
  it('Should join url parts', () => {
    const url = urlJoin('http://ipfs.io', 'ipfs', 'Qm')
    assert.equal(url, 'http://ipfs.io/ipfs/Qm')
  })
})
