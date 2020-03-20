import { mapValues } from 'lodash'
import { AragonAppJson, AragonArtifact } from '~/src/types'
import { keccak256, AbiItem } from 'web3-utils'
import { getAppId } from '../appName'
import { parseContractFunctions, AragonContractFunction } from '../ast'

function _generateAragonArtifact(
  arapp: AragonAppJson,
  abi: AbiItem[],
  functions: AragonContractFunction[]
): AragonArtifact {
  return {
    ...arapp,

    // Artifact appears to require the appId of each environment
    environments: mapValues(arapp.environments, environment => ({
      ...environment,
      appId: environment.appName ? getAppId(environment.appName) : undefined
    })),

    // Artifact appears to require the abi of each function
    functions: functions.map(fn => {
      const fnAbi = abi.find(
        abiElem =>
          abiElem.type === 'function' &&
          abiElem.name === fn.name &&
          abiElem.inputs &&
          abiElem.inputs.length === fn.paramTypes.length
      )
      return {
        roles: fn.roles.map(role => role.id),
        notice: fn.notice,
        abi: fnAbi,
        // #### Todo: Is the signature actually necessary?
        // > Will keep them for know just in case, they are found in current release
        sig: ''
      }
    }),

    // Artifact appears to require the roleId to have bytes precomputed
    roles: (arapp.roles || []).map(role => ({
      ...role,
      bytes: keccak256(role.id)
    })),

    abi,
    // Additional metadata
    flattenedCode: `./code.sol`
  }
}

// Function Overloading logic

/**
 * Returns aragon artifact.json from app data
 * @param arapp
 * @param abi
 * @param functions Parsed contract function info
 */
export function generateAragonArtifact(
  arapp: AragonAppJson,
  abi: AbiItem[],
  functions: AragonContractFunction[]
): AragonArtifact

/**
 * Returns aragon artifact.json from app data
 * @param arapp
 * @param abi
 * @param flatCode Flat code of target contract plus all imports
 * @param contractName Target contract name or path: "Finance" | "contracts/Finance.sol"
 */
export function generateAragonArtifact(
  arapp: AragonAppJson,
  abi: AbiItem[],
  flatCode: string,
  contractName: string
): AragonArtifact

export function generateAragonArtifact(
  arapp: AragonAppJson,
  abi: AbiItem[],
  functionsOrSourceCode: AragonContractFunction[] | string,
  contractName?: string
): AragonArtifact {
  if (typeof functionsOrSourceCode === 'string') {
    if (!contractName) throw Error('contractName must be defined')
    const functions = parseContractFunctions(
      functionsOrSourceCode,
      contractName
    )
    return _generateAragonArtifact(arapp, abi, functions)
  } else if (Array.isArray(functionsOrSourceCode)) {
    return _generateAragonArtifact(arapp, abi, functionsOrSourceCode)
  } else {
    throw Error(
      'Parameter functionsOrSourceCode must be of type AragonContractFunction[] | string'
    )
  }
}
