import { internalTask, task } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { getAragonArtifact, parseContractFunctions } from '@aragon/toolkit'
import { AbiItem } from 'web3-utils'
//
import {
  TASK_FLATTEN_GET_FLATTENED_SOURCE,
  TASK_ARAGON_ARTIFACT,
  TASK_ARAGON_ARTIFACT_GET
} from './task-names'
import { logMain } from '../ui/logger'
import { AragonAppJson } from '~/src/types'
import readArtifacts from './publish/readArtifacts'
import { readArapp, getMainContractName } from '../utils/arappUtils'

export default function() {
  internalTask(
    TASK_ARAGON_ARTIFACT_GET,
    'Returns generated Aragon artifact and flat code',
    async (_, { run }) => {
      const contractName = getMainContractName()

      let source: string
      try {
        source = await run(TASK_FLATTEN_GET_FLATTENED_SOURCE)
      } catch (_) {
        throw new BuidlerPluginError(
          `Your ${contractName} contract constains a cyclic dependency.
          \nYou can:
          - Remove unnecessary import statements, if any
          - Abstract the interface of imported contracts in a separate file
          - Merge multiple contracts in a single .sol file`
        )
      }

      const arapp: AragonAppJson = readArapp()
      const abi: AbiItem[] = readArtifacts(contractName)

      const contractFunctions = parseContractFunctions(source, contractName)

      return {
        artifact: getAragonArtifact(arapp, contractFunctions, abi),
        flatCode: source
      }
    }
  )

  task(
    TASK_ARAGON_ARTIFACT,
    'Generate and prints Aragon artifact for the project',
    async (_, { run }) => {
      logMain(await run(TASK_ARAGON_ARTIFACT_GET))
    }
  )
}
