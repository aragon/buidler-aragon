/**
 * Note: Only run this file intentionally to populate
 * the test-cases folder, never let this file imported
 * unless temporarily for said purpose
 */

import path from 'path'
import fs from 'fs'
import {
  getRepoVersion,
  resolveRepoContentUri,
  resolveRepoContentUriFile
} from '~/src/utils/apm'
import { getMainnetProvider } from '~/test/test-helpers/providers'
import { writeJson, writeFile } from '~/src/utils/fsUtils'
import { artifactName, flatCodeName } from '~/src/params'

const ipfsGateway = 'https://ipfs.eth.aragon.network/ipfs/'
const appsToFetch = [
  'agent',
  'finance',
  'survey',
  'token-manager',
  'vault',
  'voting'
]

/* eslint-disable no-console */

async function fetchAppPublishedAssets(
  appName: string,
  outDir: string
): Promise<void> {
  const provider = getMainnetProvider()
  const options = { ipfsGateway }
  const { contentUri } = await getRepoVersion(appName, 'latest', provider)
  const { artifact } = await resolveRepoContentUri(contentUri, options)
  const flatCode = await resolveRepoContentUriFile<string>(
    contentUri,
    flatCodeName,
    options
  )
  const appPath = path.join(outDir, appName)
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true })
  writeJson(path.join(appPath, artifactName), artifact)
  writeFile(path.join(appPath, flatCodeName), flatCode)
}

export async function fetchPublishedAssets(outDir): Promise<void> {
  for (const appName of appsToFetch) {
    console.log(`Fetching ${appName}...`)
    await fetchAppPublishedAssets(appName, outDir)
  }
}
