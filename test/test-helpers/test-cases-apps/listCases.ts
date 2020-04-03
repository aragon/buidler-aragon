import fs from 'fs'
import path from 'path'
import {
  arappName,
  artifactName,
  flatCodeName,
  manifestName
} from '~/src/params'
import { AragonAppJson, AragonArtifact, AragonManifest } from '~/src/types'
import { readFileIfExists, readJsonIfExists } from '~/src/utils/fsUtils'

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
        arapp: readJsonIfExists(path.join(appPath, arappName)),
        artifact: readJsonIfExists(path.join(appPath, artifactName)),
        manifest: readJsonIfExists(path.join(appPath, manifestName)),
        flatCode: readFileIfExists(path.join(appPath, flatCodeName))
      }
      testCases.push(testCase)
    }
  }

  return testCases
}
