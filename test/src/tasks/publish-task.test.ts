import { assert } from 'chai'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import { TASK_PUBLISH } from '~/src/tasks/task-names'
import { startGanache } from '~/src/tasks/start/backend/start-ganache'
import deployBases from '~/src/tasks/start/backend/bases/deploy-bases'
import {
  resolveRepoContentUri,
  isAddress,
  PublishVersionTxData
} from '~/src/utils/apm'
import { infuraIpfsApiUrl, infuraIpfsGateway } from '~/test/testParams'
import { defaultLocalAragonBases } from '~/src/params'
import { ethers } from 'ethers'
import { getRepoVersion } from '~/src/utils/apm'
import semver, { ReleaseType } from 'semver'
import {
  parseNewRepoWithVersionTxData,
  parseNewVersionTxData
} from '~/test/test-helpers/publishVersionTxParsers'
import {
  BuidlerRuntimeEnvironment,
  HttpNetworkConfig
} from '@nomiclabs/buidler/types'
import { getRootAccount } from '~/src/utils/accounts'
import { readArapp, parseAppName } from '~/src/utils/arappUtils'

interface RepoState {
  repoAddress: string
  version: string
  contractAddress: string
}

const ipfsApiUrl = infuraIpfsApiUrl
const ipfsGateway = infuraIpfsGateway
const appName = 'test.aragonpm.eth'

describe('Publish task', function() {
  const testAppDir = 'test-app'

  /**
   * Test utility to fetch a repo state, its address and latest version
   * @param appName
   * @param provider
   */
  async function fetchRepoState(
    _appName: string,
    bre: BuidlerRuntimeEnvironment
  ): Promise<RepoState> {
    const networkConfig = bre.network.config as HttpNetworkConfig
    const provider = new ethers.providers.Web3Provider(
      bre.web3.currentProvider,
      networkConfig.ensAddress && {
        name: bre.network.name,
        chainId: networkConfig.chainId || 5555,
        ensAddress: networkConfig.ensAddress
      }
    )
    const repoAddress = await provider.resolveName(_appName)
    if (!repoAddress) throw Error(`No address found for ENS ${_appName}`)
    const latestVersion = await getRepoVersion(repoAddress, 'latest', provider)
    return {
      repoAddress,
      version: latestVersion.version,
      contractAddress: latestVersion.contractAddress
    }
  }

  /**
   * Test utility to assert that a tx data object is correct
   * given an initial repo state an a release bump
   * @param repoState
   * @param bump
   * @param rawTxData
   */
  async function assertPublishTxData(
    repoState: RepoState,
    bump: ReleaseType,
    txData: PublishVersionTxData
  ): Promise<void> {
    const data = parseNewVersionTxData(txData)

    assert.equal(data.to, repoState.repoAddress, 'Tx to must be repo address')
    if (bump === 'major')
      assert.notEqual(
        data.contractAddress,
        repoState.contractAddress,
        'Version contract address must NOT be the same as last version'
      )
    else
      assert.equal(
        data.contractAddress,
        repoState.contractAddress,
        'Version contract address must be the same as last version'
      )
    assert.equal(
      data.version,
      semver.inc(repoState.version, bump),
      `New version should be a ${bump} bump from last version ${repoState.version}`
    )

    await assertContentUri(data.contentUri)
  }

  /**
   * Test utility to assert that the contentUri is correct by resolving its content
   * @param contentUri
   */
  async function assertContentUri(contentUri: string): Promise<void> {
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
  }

  describe('On a local network', function() {
    useEnvironment(testAppDir, 'localhost')

    before('Environment is loaded', function() {
      if (!this.env) throw Error('No .env in this, is useEnvironment run?')
    })

    let closeGanache: (() => void) | undefined
    before('Run a local testnet with bases', async function() {
      const ganache = await startGanache(this.env)
      closeGanache = ganache.close
      await deployBases(this.env)
    })

    describe(`Repo does not exist, deploy new contract and repo for ${testAppDir}`, function() {
      const bump: ReleaseType = 'major'

      it('Run publish task', async function() {
        const txData = await this.env.run(TASK_PUBLISH, { bump, ipfsApiUrl })
        const rootAccount = await getRootAccount(this.env)
        const {
          to,
          shortName,
          managerAddress,
          contractAddress,
          version,
          contentUri
        } = parseNewRepoWithVersionTxData(txData)
        // Compare with an object to see all of them at once
        assert.deepEqual(
          {
            to,
            shortName,
            managerAddress,
            version
          },
          {
            to: defaultLocalAragonBases.apmAddress,
            shortName: 'test',
            managerAddress: rootAccount,
            version: '1.0.0'
          }
        )

        assert(
          isAddress(contractAddress),
          'Release contractAddress is not a valid address'
        )

        await assertContentUri(contentUri)
      })
    })

    describe('Repo exists, patch release with just content', function() {
      const bump: ReleaseType = 'patch'
      let repoState: RepoState

      before('Fetch repo state', async function() {
        repoState = await fetchRepoState(appName, this.env)
      })

      it('Run publish task', async function() {
        const txData: PublishVersionTxData = await this.env.run(TASK_PUBLISH, {
          bump,
          ipfsApiUrl
        })
        await assertPublishTxData(repoState, bump, txData)
      })
    })

    describe('Repo exists, major release with contract and content', function() {
      const bump: ReleaseType = 'major'
      let repoState: RepoState

      before('Fetch repo state', async function() {
        repoState = await fetchRepoState(appName, this.env)
      })

      it('Run publish task', async function() {
        const txData: PublishVersionTxData = await this.env.run(TASK_PUBLISH, {
          bump,
          ipfsApiUrl
        })
        await assertPublishTxData(repoState, bump, txData)
      })
    })

    after('Stop ganache instance', function() {
      if (closeGanache) closeGanache()
    })
  })

  describe.skip('On the mainnet network', function() {
    const appName = 'finance.aragonpm.eth'
    const mainnetNetwork = 'mainnet'

    useEnvironment(testAppDir, mainnetNetwork)

    before('Environment is loaded', function() {
      if (!this.env) throw Error('No .env in this, is useEnvironment run?')
    })

    before('Retrieve config', async function() {
      const arapp = readArapp()
      assert.equal(parseAppName(arapp), appName, 'Wrong app name')
    })

    before('Make sure mainnet provider works', async function() {
      try {
        await this.env.web3.eth.getBlockNumber()
      } catch (e) {
        const url = (this.env.network.provider as any)._url
        e.message = `Provider check error ${url}: ${e.message}`
        throw e
      }
    })

    let repoState: RepoState

    before('Fetch repo state', async function() {
      repoState = await fetchRepoState(appName, this.env)
    })

    describe('Repo exists, patch release with just content', function() {
      const bump: ReleaseType = 'patch'

      it('Run publish task', async function() {
        const txData: PublishVersionTxData = await this.env.run(TASK_PUBLISH, {
          bump,
          ipfsApiUrl
        })
        await assertPublishTxData(repoState, bump, txData)
      })
    })
  })
})
