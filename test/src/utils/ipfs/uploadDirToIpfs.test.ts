import path from 'path'
import fs from 'fs'
import { assert } from 'chai'
import { uploadDirToIpfs } from '~/src/utils/ipfs'
import { debugDir, infuraIpfsApiUrl } from '~/test/testParams'
import { ensureDir } from '~/src/utils/fsUtils'
import { removeSync } from 'fs-extra'

describe('uploadDirToIpfs', function() {
  const testDir = path.join(debugDir, 'test-ipfs-dir-to-upload')
  const ipfsApiUrl = infuraIpfsApiUrl

  // The content object below always results in the same contentHash
  // contentHash is not dependant on the path of `testDir`
  const contentHash = 'Qma979GLDh43DDvTp4S1j1ip9rxnnfQYBd9sEu4jyyhZaw'
  const content = {
    'a.txt': 'aaaaaaaa',
    'b.txt': 'bbbbbbbb',
    'c.txt': 'cccccccc'
  }

  before('Create test dir to upload', () => {
    ensureDir(testDir)
    for (const [filepath, data] of Object.entries(content))
      fs.writeFileSync(path.join(testDir, filepath), data)
  })
  after('Remove test dir', () => {
    removeSync(testDir)
  })

  it('Should upload a test dir to IPFS and get the expected hash', async function() {
    const res = await uploadDirToIpfs(testDir, { ipfsApiUrl })
    assert.equal(res, contentHash, 'hash of uploaded test dir has changed')
  })
})
