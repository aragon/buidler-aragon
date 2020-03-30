/**
 * Contract instance
 */
let intialCount;

module.exports = {
  preDao: ({ log }, bre) => log(`preDao hook called`),
  postDao: ({ log }, bre) => log('postDao hook called'),
  preInit: async ( { log }, bre) => {
    log(`preInit hook called`)
  
    // Do actions required before initializing the contract
    const accounts = await bre.web3.eth.getAccounts()
    intialCount = await bre.web3.eth.getBlockNumber()
  
    // Used for testing only.
    return {
      rootAccount: accounts[0],
      intialCount
    }
  },
  getInitParams: ({ log }, bre) => {
    log(`getInitParams hook called`)
    return [intialCount]
  },
  postInit: async ({ log }, bre) =>  log(`postInit hook called`),
  postUpdate: ({ log }, bre) =>   log(`postUpdate hook called`)
}
