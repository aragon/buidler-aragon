

let token
let accounts

async function preDao({ log }, bre) {
  log(`preDao hook called`)
}

async function postDao({ dao, _experimentalAppInstaller, log }, bre) {
  log(`postDao hook called`, dao.address)

  // Installing external apps.

  /* _experimentalAppInstaller(name, appOptions) where appOptions:
  { 
     version: '3.1.2',
     network: 'rinkeby',
     initializeArgs: ['0x32..23', 0, 223],
     ...
  }
  */

  log(`Installing dependant apps from mainnet...`)
  const vault = await _experimentalAppInstaller("vault");
  const finance = await _experimentalAppInstaller("finance", {
    initializeArgs: [vault.address, 60 * 60 * 24 * 31]
  });
  log(`Installed vault: ${vault.address}`)
  log(`Installed finance: ${finance.address}`)

  // Every app have access to the createPermission() and initialize() methods.
  // To assign permissions and to initialize the proxy app.

  /* createPermission(roleName, entity):
    - roleName: 'DUMMY_ROLE'
    - entity: '0x123..456'

    initialize(initializeArgs):
    - initializeArgs: [0, '0x123...345']
  */

  await vault.createPermission("TRANSFER_ROLE", finance.address);
  await finance.createPermission("CREATE_PAYMENTS_ROLE");
  log(`Granted permissions to installed apps`)
}

async function preInit({ _experimentalAppInstaller, log }, bre) {
  log(`preInit hook called`)
  // Retrieve accounts.
  accounts = await bre.web3.eth.getAccounts()

  // Deploy sample ERC20 token.
  const ERC20Sample = bre.artifacts.require('ERC20Sample')
  token = await ERC20Sample.new()

  // Mint tokens.
  // NOTE: Tokens are automatically minted to the deploying address in this sample ERC20,
  // so no need to mint to the first account. All we need to do is transfer from the first account to the second account.
  await token.transfer(accounts[1], '1000000000000000000000')

  // Used for testing only.
  return {
    rootAccount: accounts[0],
    tokenAddress: token.address
  }
}

async function getInitParams({ log }, bre) {
  log(`getInitParams hook called`)

  const tokenAddress = token ? token.address : undefined

  return [tokenAddress, 'Wrapped token', 'wORG']
}

async function postInit({ proxy, log }, bre) {
  log(`postInit hook called`)

  const vault2 = await _experimentalAppInstaller("vault");
  log(`Second instance of vault installed: ${vault2.address}`)
  
  // We assign a permission to the proxy app we are developing
  await vault2.createPermission("TRANSFER_ROLE", proxy.address);

  log(`ERC20 token:`, token.address)
  log(`Proxy:`, proxy.address)
  log(`Account 1 token balance`, (await token.balanceOf(accounts[0])).toString())
  log(`Account 2 token balance`, (await token.balanceOf(accounts[1])).toString())
}

async function postUpdate({ log }, bre) {
  log(`postUpdate hook called`)
}


module.exports = {
  preDao,
  postDao,
  preInit,
  postInit,
  getInitParams,
  postUpdate,
}
