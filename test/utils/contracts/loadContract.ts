import fs from 'fs'
import path from 'path'

/**
 * Loads contract data as string from the directory
 * buidler-aragon/test/utils/contracts
 * @param contractName "EmptyContract"
 */
export default function loadContract(contractName: string): string {
  return fs.readFileSync(
    path.format({
      dir: __dirname,
      name: contractName,
      ext: '.sol'
    }),
    'utf8'
  )
}
