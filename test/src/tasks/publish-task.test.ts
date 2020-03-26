import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_PUBLISH } from '~/src/tasks/task-names'
import { AragonConfig } from '~/src/types'
import { startGanache } from '~/src/tasks/start/backend/start-ganache'
import deployBases from '~/src/tasks/start/backend/bases/deploy-bases'
import {
  PublishVersionTxData,
  resolveRepoContentUri,
  isAddress
} from '~/src/utils/apm'
import { infuraIpfsApiUrl, infuraIpfsGateway } from '~/test/testParams'
import { defaultLocalAragonBases } from '~/src/params'

const testAppDir = 'test-app'
const testAppContract = 'TestContract'
const testNetwork = 'localhost'

describe(`Run publish task - ${testAppDir}`, function() {
  const ipfsApiUrl = infuraIpfsApiUrl
  const ipfsGateway = infuraIpfsGateway
  const managerAddress = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'
  const bump = 'major'

  let config: AragonConfig
  let closeGanache: (() => void) | undefined
  let txData: PublishVersionTxData

  useEnvironment(testAppDir, testNetwork)

  before('Retrieve config', async function() {
    config = this.env.config.aragon as AragonConfig
  })

  before('Run a local testnet with bases', async function() {
    const ganache = await startGanache(this.env)
    closeGanache = ganache.close
    const aragonBases = await deployBases(this.env)
  })

  before('Run publish task', async function() {
    txData = await this.env.run(TASK_PUBLISH, {
      bump,
      managerAddress,
      ipfsApiUrl
    })
  })

  it('Static release parameters should be correct', () => {
    const { to, methodName, params } = txData
    // Compare with an object to see all of them at once
    assert.deepEqual(
      {
        to,
        methodName,
        shortName: params[0],
        managerAddress: params[1],
        versionArray: params[2]
      },
      {
        to: defaultLocalAragonBases.apmAddress,
        methodName: 'newRepoWithVersion',
        shortName: 'test',
        managerAddress,
        versionArray: [1, 0, 0]
      }
    )
  })

  it('Release contractAddress should be correct', function() {
    const { params } = txData
    assert(
      isAddress(params[3]),
      'Release contractAddress is not a valid address'
    )
  })

  it('Release contentUri should be correct', async function() {
    const { params } = txData
    const contentUri = params[4]

    const files = await resolveRepoContentUri(contentUri, { ipfsGateway })

    assert.deepInclude(
      files.manifest,
      { name: 'Test app', author: 'testing', description: 'Test app' },
      'manifest.json does not include expected data'
    )
    assert.deepInclude(
      files.artifact,
      { path: 'contracts/TestContract.sol' },
      'artifact.json does not include expected data'
    )
  })

  after('Stop ganache instance', function() {
    if (closeGanache) closeGanache()
  })
})
