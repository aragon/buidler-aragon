const fs = require('fs')
const path = require('path')

let token
let accounts

async function preDao(bre) {
  console.log(`preDao hook called`)

  // Used for testing only.
  await _writeLog('preDao', JSON.stringify(bre.config, null, 2))
}

async function postDao(dao, bre) {
  console.log(`postDao hook called`, dao.address)
}

async function preInit(bre) {
  console.log(`preInit hook called`)

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
  console.log(`getInitParams hook called`)

  const tokenAddress = token ? token.address : undefined
  return [tokenAddress, 'Wrapped token', 'wORG']
}

async function postInit(proxy, bre) {
  console.log(`postInit hook called`)

  console.log(`ERC20 token:`, token.address)
  console.log(`Proxy:`, proxy.address)
  console.log(`Account 1 token balance`, (await token.balanceOf(accounts[0])).toString())
  console.log(`Account 2 token balance`, (await token.balanceOf(accounts[1])).toString())
}

async function postUpdate(proxy, bre) {
  console.log(`postUpdate hook called`)
}

// ----------------------------------------------------
// Not hooks!
// Used for testing hooks.
// ----------------------------------------------------

async function _writeLog(filename, content) {
  return new Promise(resolve => {
    const logPath = path.join(__dirname, '../logs', filename)

    fs.writeFile(logPath, content, err => {
      if (err) {
        console.log(`Error while writing log: ${err.message}`)
      }
    })
  })
}

async function _deleteLogs() {
  return new Promise(resolve => {
    const logsPath = path.join(__dirname, '../logs')

    fs.readdir(logsPath, (err, files) => {
      if (err) {
        throw err
      }

      for (const file of files) {
        fs.unlink(path.join(logsPath, file), err => {
          if (err) {
            throw err
          }
        })
      }

      resolve()
    })
  })
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
