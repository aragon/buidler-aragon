let token
let accounts

async function preDao(bre) {
  console.log(`preDao hook`)
}

async function postDao(dao, bre) {
  console.log(`postDao hook`, dao.address)
}

async function preInit(bre) {
  // Retrieve accounts.
  accounts = await bre.web3.eth.getAccounts()

  // Deploy sample ERC20 token.
  const ERC20Sample = bre.artifacts.require('ERC20Sample')
  token = await ERC20Sample.new()

  // Mint tokens.
  // NOTE: Tokens are automatically minted to the deploying address in this sample ERC20,
  // so no need to mint to the first account. All we need to do is transfer from the first
  // account to the second account.
  await token.transfer(accounts[1], '1000000000000000000000')
}

async function getInitParams(bre) {
  const tokenAddress = token ? token.address : undefined
  return [tokenAddress, 'Wrapped token', 'wORG']
}

async function postInit(proxy, bre) {
  console.log(`ERC20 token:`, token.address)
  console.log(`Proxy:`, proxy.address)
  console.log(`Account 1 token balance`, (await token.balanceOf(accounts[0])).toString())
  console.log(`Account 2 token balance`, (await token.balanceOf(accounts[1])).toString())
}

async function postUpdate(proxy, bre) {
  console.log(`postUpdate hook`)
}

module.exports = {
  preDao,
  postDao,
  preInit,
  postInit,
  getInitParams,
  postUpdate
}
