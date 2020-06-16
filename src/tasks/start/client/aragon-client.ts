import execa from 'execa'
import liveServer from 'live-server'
import os from 'os'
import open from 'open'
import path from 'path'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { logFront } from '~/src/ui/logger'
import { ensureDir, writeJson, pathExists, remove } from '~/src/utils/fsUtils'

const defaultRepo = 'https://github.com/0xGabi/aragon'
const defaultVersion = '8241ccdfd69de528500af4d8cc6ad59e00c5d41a'
const aragonBaseDir: string = path.join(os.homedir(), '.aragon')

export async function installAragonClientIfNeeded(
  repo: string = defaultRepo,
  version: string = defaultVersion
): Promise<string> {
  const clientPath: string = _getClientPath(version)

  if (await _checkClientInstallationNeeded(clientPath)) {
    ensureDir(clientPath)

    logFront(
      `Installing client version ${version} locally (takes a couple of minutes)...`
    )
    const opts = { cwd: clientPath }

    try {
      logFront('  cloning...')
      await execa('git', ['clone', '--', repo, clientPath])

      logFront('  checking out version...')
      await execa('git', ['checkout', version], opts)

      logFront('  installing...')
      await execa('npm', ['install'], opts)

      logFront('  building...')
      await execa('npm', ['run', 'build:local'], opts)
    } catch (e) {
      remove(clientPath)
      throw new BuidlerPluginError(
        `There was an error while installing the Aragon client in ${clientPath}. Please make sure that this folder is deleted and try again. \n ${e.stack}`
      )
    }

    logFront('Client installed.')
  }

  return clientPath
}

async function _checkClientInstallationNeeded(
  clientPath: string
): Promise<boolean> {
  if (!pathExists(clientPath)) {
    return true
  }

  if (!pathExists(path.resolve(clientPath, 'build/index.html'))) {
    logFront('Malformed client detected, removing it for re-installation.')
    remove(clientPath)
    return true
  }

  logFront('Using cached client version.')
  return false
}

/**
 * Prepares and starts the aragon client
 * @return The URL at which the client is available
 */
export async function startAragonClient(
  clientServePort: number,
  subPath?: string,
  autoOpen = true
): Promise<{ url: string; close: () => void }> {
  const port: number = clientServePort
  const clientPath: string = _getClientPath(defaultVersion)

  const buildPath = path.join(clientPath, 'build')
  logFront(`Serving client files at ${clientPath} at port ${port}...`)
  const closeStaticServer = _createStaticWebserver(port, buildPath)

  const url = `http://localhost:${port}/#/${subPath}`

  if (autoOpen) {
    await open(url)
  }

  return { url, close: closeStaticServer }
}

/**
 * Triggers a complete client refresh (not just the iFrame) by making a dummy
 * change to the client files being served.
 * Works in tandem with live-server, which is watching for changes
 * in the client files and is in charge of triggering the actual
 * page reload.
 */
export async function refreshClient(
  version: string = defaultVersion
): Promise<void> {
  const clientPath = _getClientPath(version)

  const data = { time: new Date().getTime() }
  writeJson(path.join(clientPath, 'build', 'bump.json'), data)
}

function _getClientPath(version: string): string {
  return path.join(aragonBaseDir, `client-${version}`)
}

/**
 * Creates a static files HTTP server
 * Resolves when the server starts to listen
 * @param port 3000
 * @param rootPath Dir to serve files from
 */
export function _createStaticWebserver(port: number, root = '.'): () => void {
  liveServer.start({
    open: false,
    cors: true,
    root,
    port
  })
  return function close(): void {
    liveServer.shutdown()
  }
}
