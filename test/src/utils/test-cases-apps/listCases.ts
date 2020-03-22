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
      const arappPath = path.join(appPath, arappName)
      const artifactPath = path.join(appPath, artifactName)
      const manifestPath = path.join(appPath, manifestName)
      const flatCodePath = path.join(appPath, flatCodeName)
      const testCase: TestCase = {
        appName,
        appPath,
        arapp: readJsonIfExists(arappPath),
        artifact: readJsonIfExists(artifactPath),
        manifest: readJsonIfExists(manifestPath),
        flatCode: readFileIfExists(flatCodePath)
      }
      testCases.push(testCase)
    }
  }

  return testCases
}
