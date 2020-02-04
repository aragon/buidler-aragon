/* eslint-disable no-console */
module.exports = async (instance, { verbose = true } = {}) => {
  const { contractName, updatedAt: compiledAt } = instance.constructor._json

  if (!verbose) {
    console.log(`Deployed ${contractName}: ${instance.address}`)
  } else {
    console.log('=========')
    console.log(`# ${contractName}:`)
    console.log(`Address: ${instance.address}`)
    console.log(`Transaction hash: ${instance.transactionHash}`)
    console.log(`Compiled at: ${compiledAt}`)
    console.log('=========')
  }
}
