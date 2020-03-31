import chalk from 'chalk'
import {
  PublishVersionTxData,
  encodePublishVersionTxData
} from '~/src/utils/apm'
import { getAppNameParts } from '~/src/utils/appName'
import { urlJoin } from '~/src/utils/url'

/**
 * Returns a preview sumary of the publish tx with escape codes
 * The resulting string can be directly outputed to stdout
 */
export function getPrettyPublishTxPreview({
  txData,
  appName,
  nextVersion,
  bump,
  contractAddress,
  contentHash,
  ipfsGateway
}: {
  txData: PublishVersionTxData
  appName: string
  nextVersion: string
  bump: string
  contractAddress: string
  contentHash: string
  ipfsGateway: string
}): string {
  const { registryName } = getAppNameParts(appName)
  let action: string
  const list = new List()

  switch (txData.methodName) {
    case 'newRepoWithVersion':
      action = `Deploy new repo to registry ${chalk.green(registryName)}`
      list.addData('App name', appName)
      list.addData('Initial version', nextVersion)
      list.addData('Manager address', txData.params[1])
      break

    case 'newVersion':
      action = `Publish new version ${chalk.green(nextVersion)} (${bump})`
      break

    default:
      throw Error(`Unknown txData methodName ${txData.methodName}`)
  }

  list.addData('Contract address', contractAddress)
  list.addData('ContentURI', contentHash)

  return `
  ${action}

${list.print(2)}

  ${chalk.cyan(urlJoin(ipfsGateway, 'ipfs', contentHash))}
`
}

/**
 * Returns a string with formated data about a publish version tx
 */
export const getPublishTxOutput = {
  dryRun: ({
    txData,
    rootAccount
  }: {
    txData: PublishVersionTxData
    rootAccount: string
  }): string => {
    const list = new List()
    list.addData('from', rootAccount)
    list.addData('to', txData.to)
    list.addData('data', encodePublishVersionTxData(txData))

    return `
  ${chalk.black.bgYellow('Dry run')}
  
${list.print(2)}
`
  },

  /**
   * Display tx hash after broadcasting tx
   */
  txHash: (txHash: string, etherscanUrl: string): string => {
    const list = new List()
    list.addData('Tx hash', txHash)
    return `
  ${chalk.black.bgGreen('Tx sent')}

${list.print(2)}
  ${
    etherscanUrl
      ? `
  ${chalk.cyan(urlJoin(etherscanUrl, 'tx', txHash))}
  `
      : ''
  }`
  },

  /**
   * Display receipt after transaction is mined
   */
  receipt: (receipt: any): string => {
    const list = new List()
    list.addData('Status', receipt.status ? 'Success' : 'Revert')
    list.addData('Block number', receipt.blockNumber)
    list.addData('Gas used', receipt.gasUsed)
    return `
  ${chalk.black.bgGreen('Tx mined')}
  
${list.print(2)}
`
  }
}

/**
 * [{ name: "app name", value: "finance" }]
 */
interface DataItem {
  name: string
  value: string
}

/**
 * Utility to convert a list of key values into an equally padded list of string
 */
class List {
  data: DataItem[] = []

  addData(name: string, value: string): void {
    this.data.push({ name, value })
  }

  print(initialPad = 0): string {
    // Note: '1 +' accounts for the ':' added before padEnd
    const maxLenghtName =
      1 + Math.max(...this.data.map(item => item.name.length))

    return this.data
      .map(
        item =>
          `${' '.repeat(initialPad)}${`${item.name}:`.padEnd(
            maxLenghtName
          )}  ${chalk.green(item.value)}`
      )
      .join('\n')
  }
}
