import fs from 'fs'
import path from 'path'
import { readFileIfExists, readJsonIfExists } from '~/src/utils/fsUtils'
import {
  arappName,
  artifactName,
  flatCodeName,
  manifestName
} from '~/src/params'
import { AragonAppJson, AragonArtifact, AragonManifest } from '~/src/types'

interface TestCase {
  appName: string
  appPath: string
  arapp?: AragonAppJson
  artifact?: AragonArtifact
  manifest?: AragonManifest
  flatCode?: string
}

export function listTestCases(): TestCase[] {
  const testCases: TestCase[] = []

  const dir = __dirname
  for (const appName of fs.readdirSync(dir)) {
    const appPath = path.join(dir, appName)
    if (fs.lstatSync(appPath).isDirectory()) {
      const testCase: TestCase = {
        appName,
        appPath,
        arapp: readJsonIfExists([appPath, arappName]),
        artifact: readJsonIfExists([appPath, artifactName]),
        manifest: readJsonIfExists([appPath, manifestName]),
        flatCode: readFileIfExists([appPath, flatCodeName])
      }
      testCases.push(testCase)
    }
  }

  return testCases
}
