const fs = require('fs')
const path = require('path')

let token
let accounts

async function preDao(params, bre) {
  console.log(`preDao hook called`)

  // Used for testing only.
  const content = bre.config.aragon
  await _writeLog('preDao', JSON.stringify(content, null, 2))
}

async function postDao(params, bre) {
  console.log(`postDao hook called`, params.dao.address)

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    daoAddress: params.dao.address
  }
  await _writeLog('postDao', JSON.stringify(content, null, 2))
}

async function preInit(params, bre) {
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

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    rootAccount: accounts[0],
    tokenAddress: token.address
  }
  await _writeLog('preInit', JSON.stringify(content, null, 2))
}

async function getInitParams(params, bre) {
  console.log(`getInitParams hook called`)

  const tokenAddress = token ? token.address : undefined

  // Used for testing only.
  const content = bre.config.aragon
  await _writeLog('getInitParams', JSON.stringify(content, null, 2))

  return [tokenAddress, 'Wrapped token', 'wORG']
}

async function postInit(params, bre) {
  console.log(`postInit hook called`)

  console.log(`ERC20 token:`, token.address)
  console.log(`Proxy:`, params.proxy.address)
  console.log(`Account 1 token balance`, (await token.balanceOf(accounts[0])).toString())
  console.log(`Account 2 token balance`, (await token.balanceOf(accounts[1])).toString())

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    proxyAddress: params.proxy.address
  }
  await _writeLog('postInit', JSON.stringify(content, null, 2))
}

async function postUpdate(params, bre) {
  console.log(`postUpdate hook called`)

  // Used for testing only.
  const content = {
    ...bre.config.aragon,
    proxyAddress: params.proxy.address
  }
  await _writeLog('postUpdate', JSON.stringify(content, null, 2))
}

// ----------------------------------------------------
// Not hooks!
// Used for testing hooks.
// ----------------------------------------------------

async function _writeLog(filename, content) {
  const logsPath = path.join(__dirname, '../logs')
  if (!fs.existsSync(logsPath)){
      fs.mkdirSync(logsPath);
  }

  return new Promise(resolve => {
    const logPath = path.join(__dirname, '../logs', filename)
    console.log(`writing log: ${logPath}`)

    fs.writeFile(logPath, content, err => {
      if (err) {
        console.log(`Error while writing log: ${err.message}`)
      }

      resolve()
    })
  })
}

async function _deleteLogs() {
  return new Promise(resolve => {
    const logsPath = path.join(__dirname, '../logs')

    if (fs.existsSync(logsPath)) {
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
    } else {
      resolve()
    }
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
