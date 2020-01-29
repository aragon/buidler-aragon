const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const getBlockNumber = require('@aragon/test-helpers/blockNumber')(web3)
const { getNewProxyAddress } = require('@aragon/test-helpers/events')
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')

const { deployDao } = require('./helpers/deploy.js')(artifacts)

const ERC20 = artifacts.require('ERC20Sample')
const ERC20Disablable = artifacts.require('ERC20Disablable')
const TokenWrapper = artifacts.require('TokenWrapper')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('TokenWrapper', ([_, root, holder, someone]) => {
  const wrappedName = 'Token Wrapper'
  const wrappedSymbol = 'TWR'

  let dao, acl
  let tokenWrapperBase, tokenWrapper

  before('deploy base', async () => {
    ({ dao, acl } = await deployDao(root))
    tokenWrapperBase = await TokenWrapper.new()
  })

  beforeEach('deploy dao with uninitialized token wrapper', async () => {
    const installReceipt = await dao.newAppInstance('0x1234', tokenWrapperBase.address, '0x', false, { from: root })
    tokenWrapper = TokenWrapper.at(getNewProxyAddress(installReceipt))
  })

  it('is a forwarder', async () => {
    assert.isTrue(await tokenWrapper.isForwarder())
  })

  describe('App is not initialized yet', () => {
    let erc20

    before(async () => {
      erc20 = await ERC20.new({ from: holder }) // mints 1M e 18 tokens to sender
    })

    it('initializes app', async () => {
      await tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol)
      assert.isTrue(await tokenWrapper.hasInitialized(), 'not initialized')
      assert.equal(await tokenWrapper.depositedToken(), erc20.address, 'token address not initialized correctly')
      assert.equal(await tokenWrapper.name(), wrappedName, 'name not initialized correctly')
      assert.equal(await tokenWrapper.symbol(), wrappedSymbol, 'symbol not initialized correctly')
    })

    it('fails initializing if token is not contract', async () => {
      await assertRevert(tokenWrapper.initialize(someone, wrappedName, wrappedSymbol), 'TW_TOKEN_NOT_CONTRACT')
    })

    it('cannot be initialized twice', async () => {
      await tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol)
      await assertRevert(tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol), 'INIT_ALREADY_INITIALIZED')
    })
  })

  describe('Initialized with a proper token', () => {
    let erc20

    beforeEach('initialize token wrapper with token', async () => {
      erc20 = await ERC20.new({ from: holder }) // mints 1M e 18 tokens to sender
      await tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol)
    })

    it('is an erc20', async () => {
      assert.equal(await tokenWrapper.name(), wrappedName)
      assert.equal(await tokenWrapper.symbol(), wrappedSymbol)
      assert.equal((await tokenWrapper.decimals()).toString(), (await erc20.decimals()).toString())
    })

    it('wraps the correct erc20 token', async () => {
      assert.equal(await tokenWrapper.depositedToken(), erc20.address)
    })

    context('account has no deposited tokens', () => {
      it('can mint tokens', async () => {
        const amount = 2e18
        const initialBlockNumber = new web3.BigNumber(await getBlockNumber())

        await erc20.approve(tokenWrapper.address, amount, { from: holder })
        await tokenWrapper.deposit(amount, { from: holder })

        assert.equal((await tokenWrapper.balanceOfAt(holder, initialBlockNumber)).toString(), 0, 'Holder balance doesn\'t match')
        assert.equal((await tokenWrapper.totalSupplyAt(initialBlockNumber)).toString(), 0, 'Total supply doesn\'t match')
        assert.equal((await tokenWrapper.balanceOf(holder)).toString(), amount, 'Holder balance doesn\'t match')
        assert.equal((await tokenWrapper.totalSupply()).toString(), amount, 'Total supply doesn\'t match')
        assert.isTrue(await tokenWrapper.canForward(holder, '0x'))
        assert.equal((await erc20.balanceOf(holder)).toString(), 999998e18)
      })

      it('fails to forward if wrapped balance is zero', async () => {
        const executionTarget = await ExecutionTarget.new()

        const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
        const script = encodeCallScript([action])

        await assertRevert(tokenWrapper.forward(script, { from: holder }), 'TW_CAN_NOT_FORWARD')
      })
    })

    context('account has deposited tokens', () => {
      const wrappedAmount = 2e18

      beforeEach('deposit tokens', async () => {
        await erc20.approve(tokenWrapper.address, wrappedAmount, { from: holder })
        await tokenWrapper.deposit(wrappedAmount, { from: holder })
      })

      it('can burn tokens', async () => {
        const previousBalance = await tokenWrapper.balanceOf(holder)
        const previousSupply = await tokenWrapper.totalSupply()

        // Withdraw
        const unwrappedAmount = new web3.BigNumber(1e18)
        await tokenWrapper.withdraw(unwrappedAmount, { from: holder })

        assert.equal((await tokenWrapper.balanceOf(holder)).toString(), previousBalance.sub(unwrappedAmount), "Holder balance doesn't match")
        assert.equal((await tokenWrapper.totalSupply()).toString(), previousSupply.sub(unwrappedAmount), "Total supply doesn't match")

        assert.equal((await erc20.balanceOf(holder)).toString(), 999999e18)
      })

      it('allows to forward', async () => {
        const executionTarget = await ExecutionTarget.new()

        const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
        const script = encodeCallScript([action])

        await tokenWrapper.forward(script, { from: holder })
        assert.equal((await executionTarget.counter()).toString(), 1, 'should have received execution call')
      })
    })

    it('can not mint invalid amounts', async () => {
      await assertRevert(tokenWrapper.deposit(0, { from: holder }), 'TW_DEPOSIT_AMOUNT_ZERO')
      await assertRevert(tokenWrapper.deposit(1e30, { from: holder }), 'TW_TOKEN_TRANSFER_FROM_FAILED')
    })

    it('can not burn invalid amounts', async () => {
      await assertRevert(tokenWrapper.withdraw(0, { from: holder }), 'TW_WITHDRAW_AMOUNT_ZERO')
      await assertRevert(tokenWrapper.withdraw(1e30, { from: holder }), 'TW_INVALID_WITHDRAW_AMOUNT')
    })
  })

  describe('Initialized with a failing token', () => {
    let erc20

    beforeEach('initialize token wrapper with disablable token', async () => {
      erc20 = await ERC20Disablable.new({ from: holder }) // mints 1M e 18 tokens to sender
      await tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol)
    })

    it('can not mint if transfer fails', async () => {
      // approve
      const amount = 1e18
      await erc20.approve(tokenWrapper.address, amount, { from: holder })

      // disable token and try to mint
      await erc20.disable(true)
      await assertRevert(tokenWrapper.deposit(amount, { from: holder }), 'TW_TOKEN_TRANSFER_FROM_FAILED')
    })

    it('can not burn if transfer fails', async () => {
      // mint
      const amount = 1e18
      await erc20.approve(tokenWrapper.address, amount, { from: holder })
      await tokenWrapper.deposit(amount, { from: holder })

      // disable token and try to burn
      await erc20.disable(true)
      await assertRevert(tokenWrapper.withdraw(amount, { from: holder }), 'TW_TOKEN_TRANSFER_FAILED')
    })
  })
})
