import path from 'path'
import fs from 'fs'
import fsExtra from 'fs-extra'
import os from 'os'
import execa from 'execa'
import { logFront } from '~/src/ui/logger'
import liveServer from 'live-server'
import open from 'open'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'

const defaultRepo = 'https://github.com/aragon/aragon'
const defaultVersion = '775edd606333a111eb2693df53900039722a95dc'
const aragonBaseDir: string = path.join(os.homedir(), '.aragon')

export async function installAragonClientIfNeeded(
  repo: string = defaultRepo,
  version: string = defaultVersion
): Promise<string> {
  const clientPath: string = _getClientPath(version)

  if (await _checkClientInstallationNeeded(clientPath)) {
    fsExtra.ensureDirSync(clientPath, { recursive: true })

    const execaOpts = { cwd: clientPath }

    const execaThrowOnError = async (
      file: string,
      args?: string[]
    ): Promise<void> => {
      const result = await execa(file, args, execaOpts)
      if (result.exitCode !== 0) {
        throw Error(`exitcode ${result.exitCode}`)
      }
    }

    logFront(
      `Installing client version ${version} locally (takes a couple of minutes)...`
    )

    try {
      logFront('  cloning...')
      await execaThrowOnError('git', ['clone', '--', repo])

      logFront('  checking out version...')
      await execaThrowOnError('git', ['checkout', version])

      logFront('  installing...')
      await execaThrowOnError('npm', ['install'])

      logFront('  building...')
      await execaThrowOnError('npm', ['run', 'build:local'])
    } catch (e) {
      if (fs.existsSync(clientPath)) {
        await fsExtra.remove(clientPath)
      }
      throw new BuidlerPluginError(
        `There was an error while installing the Aragon client in ${clientPath}. Please make sure that this folder is deleted and try again.`
      )
    }

    logFront('Client installed.')
  }

  return clientPath
}

async function _checkClientInstallationNeeded(
  clientPath: string
): Promise<boolean> {
  if (!fs.existsSync(path.resolve(clientPath))) {
    return true
  }

  if (!fs.existsSync(path.resolve(clientPath, 'build/index.html'))) {
    logFront('Malformed client detected, removing it for re-installation.')
    await fsExtra.remove(clientPath)
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
): Promise<string> {
  const port: number = clientServePort
  const clientPath: string = _getClientPath(defaultVersion)

  const buildPath = path.join(clientPath, 'build')
  logFront(`Serving client files at ${clientPath} at port ${port}...`)
  await _createStaticWebserver(port, buildPath)

  const url = `http://localhost:${port}/#/${subPath}`

  if (autoOpen) {
    await open(url)
  }

  return url
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

  const filename = 'bump.json'
  const filepath = path.join(clientPath, 'build', filename)

  await fsExtra.writeJson(filepath, {
    time: new Date().getTime()
  })
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
export function _createStaticWebserver(port: number, root = '.'): void {
  liveServer.start({
    open: false,
    cors: true,
    root,
    port
  })
}
