import { ethers } from 'ethers'
import { keyBy } from 'lodash'
import { keccak256, AbiItem } from 'web3-utils'
import { AragonAppJson, AragonArtifact } from '~/src/types'
import { getAppId } from '~/src/utils/appName'
import { parseContractFunctions, AragonContractFunction } from '~/src/utils/ast'

const abiFallback = {
  payable: true,
  stateMutability: 'payable',
  type: 'fallback'
}

function _generateAragonArtifact(
  appEnsName: string,
  arapp: AragonAppJson,
  abi: AbiItem[],
  functions: AragonContractFunction[]
): AragonArtifact {
  const abiFunctions = abi.filter(abiElem => abiElem.type === 'function')
  const abiBySignature = keyBy(abiFunctions, ethers.utils.formatSignature)

  return {
    ...arapp,

    // Artifact appears to require the abi of each function
    functions: functions.map(parsedFn => ({
      roles: parsedFn.roles.map(role => role.id),
      notice: parsedFn.notice,
      abi:
        abiBySignature[parsedFn.sig] ||
        (parsedFn.sig === 'fallback' ? abiFallback : null),
      // #### Todo: Is the signature actually necessary?
      // > Will keep them for know just in case, they are found in current release
      sig: parsedFn.sig
    })),

    deprecatedFunctions: {},

    // Artifact appears to require the roleId to have bytes precomputed
    roles: (arapp.roles || []).map(role => ({
      ...role,
      bytes: keccak256(role.id)
    })),

    abi,
    // Additional metadata
    flattenedCode: './code.sol',
    appName: appEnsName,
    appId: getAppId(appEnsName)
  }
}

// Function Overloading logic

/**
 * Returns aragon artifact.json from app data
 * @param appEnsName "finance.aragonpm.eth"
 * @param arapp
 * @param abi
 * @param functions Parsed contract function info
 */
export function generateAragonArtifact(
  appEnsName: string,
  arapp: AragonAppJson,
  abi: AbiItem[],
  functions: AragonContractFunction[]
): AragonArtifact

/**
 * Returns aragon artifact.json from app data
 * @param appEnsName "finance.aragonpm.eth"
 * @param arapp
 * @param abi
 * @param flatCode Flat code of target contract plus all imports
 * @param contractName Target contract name or path: "Finance" | "contracts/Finance.sol"
 */
export function generateAragonArtifact(
  appEnsName: string,
  arapp: AragonAppJson,
  abi: AbiItem[],
  flatCode: string,
  contractName: string
): AragonArtifact

export function generateAragonArtifact(
  appEnsName: string,
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
    return _generateAragonArtifact(appEnsName, arapp, abi, functions)
  } else if (Array.isArray(functionsOrSourceCode)) {
    return _generateAragonArtifact(
      appEnsName,
      arapp,
      abi,
      functionsOrSourceCode
    )
  } else {
    throw Error(
      'Parameter functionsOrSourceCode must be of type AragonContractFunction[] | string'
    )
  }
}
