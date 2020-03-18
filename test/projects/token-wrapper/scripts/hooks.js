const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const rimraf = require('rimraf')

let token
let accounts

async function preDao({ log }, bre) {
  log(`preDao hook called`)

  // Used for testing only.
  const content = bre.config.aragon
  await _writeLog('preDao', content, log)
}

async function postDao({ dao, log }, bre) {
  log(`postDao hook called`, dao.address)

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    daoAddress: dao.address
  }
  await _writeLog('postDao', content, log)
}

async function preInit({ appInstaller, log }, bre) {
  log(`preInit hook called`)
  
  // Demo installing external apps
  log(`Installing dependant apps from mainnet...`)
  const vault = await appInstaller("vault");
  const finance = await appInstaller("finance", {
    initializeArgs: [vault.address, 60 * 60 * 24 * 31]
  });
  log(`Installed vault: ${vault.address}`)
  log(`Installed finance: ${finance.address}`)

  await vault.createPermission("TRANSFER_ROLE", finance.address);
  await finance.createPermission("CREATE_PAYMENTS_ROLE");
  log(`Granted permissions to installed apps`)

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
  const content = {
    ...bre.config.aragon,
    rootAccount: accounts[0],
    tokenAddress: token.address
  }
  await _writeLog('preInit', content, log)
}

async function getInitParams({ log }, bre) {
  log(`getInitParams hook called`)

  const tokenAddress = token ? token.address : undefined

  // Used for testing only.
  const content = bre.config.aragon
  await _writeLog('getInitParams', content, log)

  return [tokenAddress, 'Wrapped token', 'wORG']
}

async function postInit({ proxy, log }, bre) {
  log(`postInit hook called`)

  log(`ERC20 token:`, token.address)
  log(`Proxy:`, proxy.address)
  log(`Account 1 token balance`, (await token.balanceOf(accounts[0])).toString())
  log(`Account 2 token balance`, (await token.balanceOf(accounts[1])).toString())

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    proxyAddress: proxy.address
  }
  await _writeLog('postInit', content, log)
}

async function postUpdate({ proxy, log }, bre) {
  log(`postUpdate hook called`)

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    proxyAddress: proxy.address
  }
  await _writeLog('postUpdate', content, log)
}

// ----------------------------------------------------
// Not hooks!
// Used for testing hooks.
// ----------------------------------------------------

/**
 * Writes a text log to file
 * @param {string} filename 
 * @param {string} content 
 * @param {(message: string) => void} log 
 * @return {Promise<void>}
 */
async function _writeLog(filename, content, log = console.log) {
  const logsPath = path.join(__dirname, '../logs')
  if (!fs.existsSync(logsPath)){
      fs.mkdirSync(logsPath);
  }

  const logPath = path.join(__dirname, '../logs', filename)
  const data = typeof content === "object" 
      ? JSON.stringify(content, null, 2)
      : content
  log(`writing log: ${logPath}`)

  return promisify(fs.writeFile)(logPath, data).catch(e => {
    log(`Error while writing log: ${e.message}`)
  })
}

async function _deleteLogs() {
  const logsPath = path.join(__dirname, '../logs')
  return promisify(rimraf)(logsPath)
}

// ----------------------------------------------------

module.exports = {
  preDao,
  postDao,
  preInit,
  postInit,
  getInitParams,
  postUpdate,
  // Used for testing:
  _deleteLogs
}
