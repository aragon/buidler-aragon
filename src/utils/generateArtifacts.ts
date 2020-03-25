import namehash from 'eth-ens-namehash'
import web3EthAbi, { AbiCoder } from 'web3-eth-abi'
import { extractContractInfo } from './solidityExtractor'
import { AragonAppJson, Role, AragonEnvironments, AbiItem } from '../types'

// Note: fix necessary to correct wrong 'web3-eth-abi' typings
const { encodeFunctionSignature }: AbiCoder = web3EthAbi as any

const SOLIDITY_FILE = 'code.sol'

interface FunctionInfo {
  sig: string // "functionName(address,unit)"
  roles: string[]
  notice: string // Multiline notice text
}

interface FunctionInfoWithAbi extends FunctionInfo {
  abi?: AbiItem // Abi of the function, may not be found
}

export interface AragonApplicationArtifact extends AragonAppJson {
  flattenedCode: string
  environments: AragonEnvironments
  roles: Role[]
  functions: FunctionInfoWithAbi[]
  abi: AbiItem[]
}

/**
 * @param environments
 * @return
 */
function decorateEnvrionmentsWithAppId(
  environments: AragonEnvironments
): AragonEnvironments {
  const decoratedEnvrionment = {}
  for (const [key, value] of Object.entries(environments)) {
    decoratedEnvrionment[key] = {
      ...value,
      appId: namehash.hash(value.appName)
    }
  }
  return decoratedEnvrionment
}

/**
 * Appends the abi of a function to the functions array
 * @param functionsInfo functions info
 * @param abi ABI
 * @return functions with appended ABI
 */
function decorateFunctionsWithAbi(
  functionsInfo: FunctionInfo[],
  abi: AbiItem[]
): FunctionInfoWithAbi[] {
  const abiFunctions = abi.filter(elem => elem.type === 'function')
  return functionsInfo.map(functionInfo => ({
    ...functionInfo,
    abi: abiFunctions.find(
      functionAbi =>
        encodeFunctionSignature(functionAbi) ===
        encodeFunctionSignature(functionInfo.sig)
    )
  }))
}

/**
 * Construct artifact object
 *
 * @param {ArappConfigFile} arapp Arapp config file
 * @param {Object[]} abi ABI
 * @param {string} sourceCode Solidity file
 * @return {Object} artifact
 */
export function generateApplicationArtifact(
  arapp: AragonAppJson,
  abi: AbiItem[],
  sourceCode: string
): AragonApplicationArtifact {
  // Includes appId for each environemnt
  const environmentsWithAppId = decorateEnvrionmentsWithAppId(
    arapp.environments
  )

  // Extracts relevant functions and role info from a Solidity file
  const { functions, roles } = extractContractInfo(sourceCode)

  // Includes abi for each function
  const functionsWithAbi = decorateFunctionsWithAbi(functions, abi)

  // NOTE: Previous versions compared that arapp.json roles match
  //       the contract ones. Perform this step at a different stage

  // TODO: Add deprectaedFunctions logic

  return {
    ...arapp,
    flattenedCode: `./${SOLIDITY_FILE}`,
    environments: environmentsWithAppId,
    roles,
    functions: functionsWithAbi,
    abi
  }
}
