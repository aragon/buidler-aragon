import { assert } from 'chai'
import { isNonZeroAddress } from '~/test/test-helpers/isNonZeroAddress'
import { useEnvironment } from '~/test/test-helpers/useEnvironment'
import deployAragonBases from '~/src/tasks/start/backend/bases'
import { defaultLocalAragonBases } from '~/src/params'
import { startGanache, stopGanache } from '~/src/tasks/start/backend/ganache'
import { createEns } from '~/src/tasks/start/backend/ens'

describe('bases.ts', function() {
  // Note: These particular tests use localhost instead of buidlerevm.
  // This is required for bases to have the expected addresses,
  // And because we want to restart the chain on certain tests.
  useEnvironment('counter', 'localhost')

  describe('when no bases are deployed', async function() {
    let ensAddress, daoFactoryAddress, apmAddress

    before('start ganache', async function() {
      await startGanache(this.env)
    })

    before('deploy bases', async function() {
      // Destrucure response into existing variables.
      // Prettier insists on this format ¯\_(ツ)_/¯
      ;({ ensAddress, daoFactoryAddress, apmAddress } = await deployAragonBases(
        this.env
      ))
    })

    after('stop ganache', function() {
      stopGanache()
    })

    it('deploys an ens instance with a valid address', function() {
      assert(isNonZeroAddress(ensAddress), 'Invalid contract address.')
    })

    it('deploys a dao factory instance with a valid address', function() {
      assert(isNonZeroAddress(daoFactoryAddress), 'Invalid contract address.')
    })

    it('deploys an apm instance with a valid address', function() {
      assert(isNonZeroAddress(apmAddress), 'Invalid contract address.')
    })

    it('deploys bases with the expected addresses', async function() {
      assert.equal(
        ensAddress,
        defaultLocalAragonBases.ensAddress,
        'Non matching ens address'
      )
      assert.equal(
        apmAddress,
        defaultLocalAragonBases.apmAddress,
        'Non matching dao factory address'
      )
      assert.equal(
        daoFactoryAddress,
        defaultLocalAragonBases.daoFactoryAddress,
        'Non matching apm address'
      )
    })

    describe('when all bases are deployed', async function() {
      let blockBefore

      describe('when attempting to deploy bases again', async function() {
        before('deploy bases again', async function() {
          blockBefore = await this.env.web3.eth.getBlockNumber()
          ;({
            ensAddress,
            daoFactoryAddress,
            apmAddress
          } = await deployAragonBases(this.env))
        })

        it('should not deploy any contracts', async function() {
          const currentBlock = await this.env.web3.eth.getBlockNumber()

          assert.equal(
            blockBefore,
            currentBlock,
            'deployAragonBases emitted transactions'
          )
        })

        it('should return the default addresses', async function() {
          assert.equal(
            ensAddress,
            defaultLocalAragonBases.ensAddress,
            'Non matching ens address'
          )
          assert.equal(
            apmAddress,
            defaultLocalAragonBases.apmAddress,
            'Non matching dao factory address'
          )
          assert.equal(
            daoFactoryAddress,
            defaultLocalAragonBases.daoFactoryAddress,
            'Non matching apm address'
          )
        })
      })
    })
  })

  describe('when some bases are deployed', async function() {
    before('start ganache', async function() {
      await startGanache(this.env)
    })

    after('stop ganache', function() {
      stopGanache()
    })

    before('deploy an ENS instance', async function() {
      const ens = await createEns(this.env.web3, this.env.artifacts)

      assert.equal(
        ens.address,
        defaultLocalAragonBases.ensAddress,
        'Test needs ENS to be deployed at the expected address.'
      )
    })

    it('throws when attempting to deploy bases', async function() {
      await deployAragonBases(this.env).catch(err => {
        assert.equal(
          err.message,
          'Only some Aragon bases are deployed in the current testnet. Restart its state and retry',
          'An error was thrown but it wasnt the expected error.'
        )
      })
    })
  })
})
