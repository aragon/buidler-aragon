import path from 'path'
import fs from 'fs'
import fsExtra from 'fs-extra'
import os from 'os'
import { execaLogTo } from '../execa'
import { logFront } from '../logger'
import liveServer from 'live-server'
import open from 'open'

const defaultRepo = 'https://github.com/aragon/aragon'
const defaultVersion = '775edd606333a111eb2693df53900039722a95dc'
const aragonBaseDir: string = path.join(os.homedir(), '.aragon')

const execa = execaLogTo(logFront)

export async function installAragonClientIfNeeded(
  repo: string = defaultRepo,
  version: string = defaultVersion
): Promise<string> {
  // Determine client path.
  const clientPath: string = _getClientPath(version)

  // Verify installation or install if needed.
  if (fs.existsSync(path.resolve(clientPath))) {
    logFront('Using cached client version')
  } else {
    fsExtra.ensureDirSync(clientPath, { recursive: true })
    logFront(`Installing client version ${version} locally`)
    const opts = { cwd: clientPath }
    await execa('git', ['clone', '--', repo, clientPath])
    await execa('git', ['checkout', version], opts)
    await execa('npm', ['install'], opts)
    await execa('npm', ['run', 'build:local'], opts)
  }

  return clientPath
}

/**
 * Prepares and starts the aragon client
 * @return The URL at which the client is available
 */
export async function startAragonClient(
  clientServePort: number,
  subPath?: string,
  version: string = defaultVersion,
  autoOpen = true
): Promise<string> {
  const port: number = clientServePort
  const clientPath: string = _getClientPath(version)

  logFront(`Starting client server at port ${port}`)
  await _createStaticWebserver(port, path.join(clientPath, 'build'))

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
    root,
    port,
    cors: '*'
  })
}
