import path from 'path'
import { readFile } from '~/src/utils/fsUtils'

/**
 * Loads contract data as string from the directory
 * buidler-aragon/test/utils/contracts
 * @param contractName "EmptyContract"
 */
export default function loadTestContract(contractName: string): string {
  return readFile(
    path.format({
      dir: path.join(__dirname, '../contracts/'),
      name: contractName,
      ext: '.sol'
    })
  )
}
