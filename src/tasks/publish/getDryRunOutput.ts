import {
  PublishVersionTxData,
  encodePublishVersionTxData
} from '~/src/utils/apm'
import { getAppNameParts } from '~/src/utils/appName'

interface DataItem {
  name: string
  value: string
}

/**
 * Returns a string with formated data about a publish version tx
 */
export function getDryRunOutput({
  txData,
  appName,
  nextVersion,
  bump,
  contractAddress,
  contentHash,
  ipfsGateway,
  rootAccount
}: {
  txData: PublishVersionTxData
  appName: string
  nextVersion: string
  bump: string
  contractAddress: string
  contentHash: string
  ipfsGateway: string
  rootAccount: string
}): string {
  const { registryName } = getAppNameParts(appName)
  let action: string
  const params: DataItem[] = []
  const addData = (name: string, value: string): void => {
    params.push({ name, value })
  }

  switch (txData.methodName) {
    case 'newRepoWithVersion':
      action = `Deploy new repo to registry ${registryName}`
      addData('app name', appName)
      addData('initial version', nextVersion)
      addData('manager address', txData.params[1])
      break

    case 'newVersion':
      action = `Publish new version ${nextVersion} (${bump})`
      break

    default:
      throw Error(`Unknown txData methodName ${txData.methodName}`)
  }

  addData('Contract address', contractAddress)
  addData('ContentURI', `ipfs:${contentHash}`)

  return `

  ${action}

${_toList(params, 2)}

  ${ipfsGateway}/ipfs/${contentHash}
  
  
  from: ${rootAccount}
  to: ${txData.to}
  data: ${encodePublishVersionTxData(txData)}

`
}

/**
 * Utility to convert a list of key values into an equally padded list of string
 * @param data [{ name: "app name", value: "finance" }]
 * @param initialPad Tab all rows by num of spaces
 */
function _toList(data: DataItem[], initialPad = 0): string {
  // Note: '1 +' accounts for the ':' added before padEnd
  const maxLenghtName = 1 + Math.max(...data.map(item => item.name.length))

  return data
    .map(
      item =>
        `${' '.repeat(initialPad)}${`${item.name}:`.padEnd(maxLenghtName)}  ${
          item.value
        }`
    )
    .join('\n')
}
