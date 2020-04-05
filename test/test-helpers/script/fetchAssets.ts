/**
 * Note: Only run this file intentionally to populate
 * the test-cases folder, never let this file imported
 * unless temporarily for said purpose
 */

import path from 'path'
import { artifactName, flatCodeName, defaultIpfsGateway } from '~/src/params'
import {
  getRepoVersion,
  resolveRepoContentUri,
  resolveRepoContentUriFile
} from '~/src/utils/apm'
import { writeJson, writeFile, ensureDir } from '~/src/utils/fsUtils'
import { getMainnetProvider } from '~/test/test-helpers/providers'

const ipfsGateway = defaultIpfsGateway
const appsToFetch = ['agent', 'finance', 'token-manager', 'vault', 'voting']

/* eslint-disable no-console */

async function fetchAppPublishedAssets(
  appName: string,
  outDir: string
): Promise<void> {
  const provider = getMainnetProvider()
  const options = { ipfsGateway }
  const { contentUri } = await getRepoVersion(appName, 'latest', provider)
  const { artifact } = await resolveRepoContentUri(contentUri, options)
  const flatCode = await resolveRepoContentUriFile(
    contentUri,
    flatCodeName,
    options
  )
  const appPath = path.join(outDir, appName)
  ensureDir(appPath)
  writeJson(path.join(appPath, artifactName), artifact)
  writeFile(path.join(appPath, flatCodeName), flatCode)
}

export async function fetchPublishedAssets(outDir): Promise<void> {
  for (const appName of appsToFetch) {
    console.log(`Fetching ${appName}...`)
    await fetchAppPublishedAssets(appName, outDir)
  }
}
