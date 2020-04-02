import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { logFront } from '~/src/ui/logger'
import { AragonConfig } from '~/src/types'
import {
  installAragonClientIfNeeded,
  startAragonClient
} from './client/aragon-client'

/**
 * Retrieves the Aragon client using git, builds it, builds the app's frontend and serves the build.
 * Starts the Aragon client pointed at a Dao and an app, and watches for changes on the app's sources.
 */
export async function startClient(
  bre: BuidlerRuntimeEnvironment,
  daoAddress: string,
  appAddress: string,
  openBrowser: boolean
): Promise<{
  /**
   * Closes open file watchers and file servers
   */
  close: () => void
}> {
  const config: AragonConfig = bre.config.aragon as AragonConfig

  logFront('Checking Aragon client...')
  await installAragonClientIfNeeded()

  // Start Aragon client at the deployed address.
  const appServePort = config.appServePort as number
  const appURL = `http://localhost:${appServePort}`
  const { url: clientURL, close: closeStaticServer } = await startAragonClient(
    config.clientServePort as number,
    `${daoAddress}/${appAddress}`,
    openBrowser
  )
  logFront(`You can now view the Aragon client in the browser.
App content: ${appURL}
Client:  ${clientURL}`)

  return {
    close: (): void => {
      closeStaticServer()
    }
  }
}
