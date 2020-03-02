import web3EthAbi from 'web3-eth-abi'

const newVersionAbi = {
  constant: false,
  inputs: [
    { name: '_newSemanticVersion', type: 'uint16[3]' },
    { name: '_contractAddress', type: 'address' },
    { name: '_contentURI', type: 'bytes' }
  ],
  name: 'newVersion',
  outputs: [],
  type: 'function'
}

const newRepoWithVersionAbi = {
  constant: false,
  inputs: [
    { name: '_name', type: 'string' },
    { name: '_dev', type: 'address' },
    { name: '_initialSemanticVersion', type: 'uint16[3]' },
    { name: '_contractAddress', type: 'address' },
    { name: '_contentURI', type: 'bytes' }
  ],
  name: 'newRepoWithVersion',
  outputs: [{ name: '', type: 'address' }],
  type: 'function'
}

/**
 * Returns encoded tx data for publishing a new version
 * Supports:
 * - newVersion
 * - newRepoWithVersion
 */
export default function encodePublishVersionTxData({
  methodName,
  params
}: {
  methodName: string
  params: any[]
}): string {
  switch (methodName) {
    case 'newVersion':
      return web3EthAbi.encodeFunctionCall(newVersionAbi, params)
    case 'newRepoWithVersion':
      return web3EthAbi.encodeFunctionCall(newRepoWithVersionAbi, params)
    default:
      throw Error(`Unknown methodName: ${methodName}`)
  }
}
