import path from 'path'
import fs from 'fs'
import fsExtra from 'fs-extra'
import os from 'os'
import open from 'open'
import { execaLogTo } from '../execa'
import { logFront } from '../logger'
import StaticServer from 'static-server'

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

function _getClientPath(version: string): string {
  return path.join(aragonBaseDir, `client-${version}`)
}

/**
 * Creates a static files HTTP server
 * Resolves when the server starts to listen
 * @param port 3000
 * @param rootPath Dir to serve files from
 */
export function _createStaticWebserver(
  port: number,
  rootPath = '.'
): Promise<void> {
  return new Promise(resolve => {
    const server = new StaticServer({
      rootPath, // required, the root of the server file tree
      port, // required, the port to listen
      cors: '*' // optional, defaults to undefined
    })

    server.start(() => {
      resolve()
    })
  })
}
