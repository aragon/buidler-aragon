import { assert } from 'chai'
import path from 'path'
import fs from 'fs'
import { generateAragonArtifact } from '~/src/utils/artifact'
import { listTestCases } from '../test-cases-apps/listCases'
import { sortBy, keyBy } from 'lodash'
import { writeJson } from '~/src/utils/fsUtils'
import { artifactName } from '~/src/params'
import { AragonArtifact } from '~/src/types'

const writeToDebug = false
const debugDir = '.debug'

describe('ast > generateAragonArtifact', () => {
  for (const testCase of listTestCases()) {
    const { arapp, flatCode, artifact, appName } = testCase
    if (arapp && flatCode && artifact) {
      it(`Should generate artifact.json - ${appName}`, () => {
        const newArtifact = generateAragonArtifact(
          arapp,
          artifact.abi,
          flatCode,
          arapp.path
        )

        // Store the created files for easier debugging
        if (writeToDebug) {
          if (!fs.existsSync(debugDir))
            fs.mkdirSync(debugDir, { recursive: true })
          writeJson(
            path.join(debugDir, `${appName}_${artifactName}`),
            newArtifact
          )
        }

        // Compare the functions array as an object before
        // Array diff-ing makes it much harder to see which specific
        // functions where excluded / included
        /* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
        const functionsBySig = (a: AragonArtifact) =>
          keyBy(a.functions, f => f.sig)
        assert.deepEqual(
          functionsBySig(newArtifact),
          functionsBySig(artifact),
          'wrong functions in artifact.json'
        )

        const prepareArtifactToCompare = (_artifact: AragonArtifact): void => {
          // Since the functions parser algorythm is different
          // the order of functions will change. Sort them here
          _artifact.functions = sortBy(_artifact.functions, f => f.sig)
          // ### Todo:, clarify what should be included in artifact.json
          delete _artifact.flattenedCode
          delete (_artifact as any).deprecatedFunctions
          // delete (_artifact as any).deployment
        }
        assert.deepEqual(
          prepareArtifactToCompare(newArtifact),
          prepareArtifactToCompare(artifact),
          'wrong artifact.json'
        )
      })
    } else {
      it.skip(`Should generate artifact.json ${appName}`, () => {})
    }
  }
})
