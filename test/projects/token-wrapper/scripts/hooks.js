

let token
let accounts

async function preDao(params, bre) {
  console.log(`preDao hook called`)
}

async function postDao(params, bre) {
  console.log(`postDao hook called`, params.dao.address)
}

async function preInit({ _experimentalAppInstaller }, bre) {
  console.log(`preInit hook called`)
  
  // Demo installing external apps
  console.log(`Installing dependant apps from mainnet...`)
  const vault = await _experimentalAppInstaller("vault");
  const vault2 = await _experimentalAppInstaller("vault");
  const finance = await _experimentalAppInstaller("finance", {
    initializeArgs: [vault.address, 60 * 60 * 24 * 31]
  });
  console.log(`Installed vault: ${vault.address}`)
  console.log(`Second instance of vault installed: ${vault2.address}`)
  console.log(`Installed finance: ${finance.address}`)

  await vault.createPermission("TRANSFER_ROLE", finance.address);
  await vault2.createPermission("TRANSFER_ROLE", finance.address);
  await finance.createPermission("CREATE_PAYMENTS_ROLE");
  console.log(`Granted permissions to installed apps`)

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

  // Used for testing only.
  return {
    rootAccount: accounts[0],
    tokenAddress: token.address
  }
}

async function getInitParams(params, bre) {
  console.log(`getInitParams hook called`)

  const tokenAddress = token ? token.address : undefined

  return [tokenAddress, 'Wrapped token', 'wORG']
}

async function postInit({ proxy }, bre) {
  console.log(`postInit hook called`)

  console.log(`ERC20 token:`, token.address)
  console.log(`Proxy:`, proxy.address)
  console.log(`Account 1 token balance`, (await token.balanceOf(accounts[0])).toString())
  console.log(`Account 2 token balance`, (await token.balanceOf(accounts[1])).toString())
}

async function postUpdate(params, bre) {
  console.log(`postUpdate hook called`)
}


module.exports = {
  preDao,
  postDao,
  preInit,
  postInit,
  getInitParams,
  postUpdate,
}
