/**
 * Contract instance
 */
let intialCount;

module.exports = {
  preDao: (params, bre) => console.log(`preDao hook called`),
  postDao: (params, bre) => console.log('postDao hook called'),
  preInit: async (params, bre) => {
    console.log(`preInit hook called`)
  
    // Do actions required before initializing the contract
    const accounts = await bre.web3.eth.getAccounts()
    intialCount = await bre.web3.eth.getBlockNumber()
  
    // Used for testing only.
    return {
      rootAccount: accounts[0],
      intialCount
    }
  },
  getInitParams: (params, bre) => {
    console.log(`getInitParams hook called`)
    return [intialCount]
  },
  postInit: async (params, bre) =>  console.log(`postInit hook called`),
  postUpdate: (params, bre) =>   console.log(`postUpdate hook called`)
}
