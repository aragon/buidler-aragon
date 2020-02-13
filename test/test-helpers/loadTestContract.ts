import fs from 'fs'
import path from 'path'

/**
 * Loads contract data as string from the directory
 * buidler-aragon/test/utils/contracts
 * @param contractName "EmptyContract"
 */
export default function loadTestContract(contractName: string): string {
  return fs.readFileSync(
    path.format({
      dir: path.join(__dirname, '../contracts/'),
      name: contractName,
      ext: '.sol'
    }),
    'utf8'
  )
}
