import path from 'path'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { readJson, writeJson, writeFile, ensureDir } from '../fsUtils'
import { TASK_FLATTEN_GET_FLATTENED_SOURCE } from '@nomiclabs/buidler/builtin-tasks/task-names'
import { generateAragonArtifact } from './generateAragonArtifact'
import { artifactName, manifestName, flatCodeName } from '~/src/params'
import { AragonManifest, AbiItem } from '~/src/types'
import { getMainContractName, readArapp } from '../arappUtils'

/**
 * Generate and write aragon artifacts to outPath
 * - artifact
 * - manifest
 * - flatCode
 * @param outPath "dist"
 * @param bre
 */
export async function generateArtifacts(
  outPath: string,
  bre: BuidlerRuntimeEnvironment
): Promise<void> {
  const arapp = readArapp()
  const manifest = readJson<AragonManifest>(manifestName)
  const contractName: string = getMainContractName()

  // buidler will detect and throw for cyclic dependencies
  // any flatten task also compiles
  const flatCode = await bre.run(TASK_FLATTEN_GET_FLATTENED_SOURCE)
  // Get ABI from generated artifacts in compilation
  const abi = _readArtifact(contractName, bre).abi

  const artifact = generateAragonArtifact(arapp, abi, flatCode, contractName)
  ensureDir(outPath)
  writeJson(path.join(outPath, artifactName), artifact)
  writeJson(path.join(outPath, manifestName), manifest)
  writeFile(path.join(outPath, flatCodeName), flatCode)
}

interface BuidlerArtifact {
  contractName: string
  abi: AbiItem[]
  bytecode: string
  deployedBytecode: string
  linkReferences: {}
  deployedLinkReferences: {}
}

/**
 * Internal util to type and encapsulate interacting with artifacts
 * @param contractName "Counter"
 * @param bre
 */
function _readArtifact(
  contractName: string,
  bre: BuidlerRuntimeEnvironment
): BuidlerArtifact {
  return bre.artifacts.require(contractName)
}
