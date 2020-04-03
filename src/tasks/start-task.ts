import path from 'path'
import tcpPortUsed from 'tcp-port-used'
import { task } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { aragenMnemonic, aragenAccounts } from '~/src/params'
import { AragonConfig } from '~/src/types'
import { logMain } from '~/src/ui/logger'
import { getAppId, getAppNameParts } from '~/src/utils/appName'
import { readArapp, parseAppName } from '~/src/utils/arappUtils'
import { readJson, pathExists } from '~/src/utils/fsUtils'
import onExit from '~/src/utils/onExit'
import { startBackend } from './start/start-backend'
import { startClient } from './start/start-client'
import { startFrontend } from './start/start-frontend'
import { TASK_START } from './task-names'

type CallbackClose = () => void

/**
 * Sets up the start task
 * Main, composite, task. Calls startBackend, then startFrontend,
 * and then returns an unresolving promise to keep the task open.
 *
 * Note: Tasks must be setup in a function. If task() is run in the
 * module body on test teardown, they will not be setup again
 */
export function setupStartTask(): void {
  task(TASK_START, 'Starts Aragon app development')
    .addFlag(
      'noBrowser',
      'Prevents opening of a browser tab with the Aragon client once the app is built.'
    )
    .addFlag('silent', 'Silences all console output')
    .setAction(async (params, bre: BuidlerRuntimeEnvironment) => {
      if (params.silent) {
        // eslint-disable-next-line
        console.log = () => {}
      }

      logMain(`Starting Aragon app development...`)

      const arapp = readArapp()
      const appNameProduction = parseAppName(arapp)
      const { shortName } = getAppNameParts(appNameProduction)
      // Note: Since only the aragonpm.eth APM registry is deployed in development,
      // all apps will be hosted there regardless of their name
      const appName = `${shortName}.aragonpm.eth`
      const appId: string = getAppId(appName)

      logMain(`App name: ${shortName}
App id: ${appId}`)

      let accountsStr = ''
      for (let i = 0; i < aragenAccounts.length; i++) {
        const account = aragenAccounts[i]
        accountsStr += `Account ${i} private key ${account.privateKey}\n`
        accountsStr += `           public key ${account.publicKey}\n`
      }

      logMain(`Accounts mnemonic "${aragenMnemonic}"
${accountsStr}`)

      const {
        daoAddress,
        appAddress,
        close: closeBackend
      } = await startBackend({ appName, silent: params.silent }, bre)

      const closeHandlers: CallbackClose[] = []
      closeHandlers.push(closeBackend)

      const config: AragonConfig = bre.config.aragon as AragonConfig
      if (!config.appSrcPath) {
        logMain(
          'Warning: appSrcPath is not defined, will continue development without building any front end.'
        )
      } else if (!pathExists(config.appSrcPath)) {
        logMain(
          `Warning: No front end found at ${config.appSrcPath}, will continue development without building any front end.`
        )
      } else {
        await _checkPorts(config)
        await _checkScripts(config.appSrcPath as string)

        // #### Here the app closes after 10 seconds
        // The delay is caused by buidler artifact instances that may be doing polling
        const { close: closeFrontend } = await startFrontend(bre)
        closeHandlers.push(closeFrontend)
      }

      const { close: closeClient } = await startClient(
        bre,
        daoAddress,
        appAddress,
        !params.noBrowser
      )
      closeHandlers.push(closeClient)

      function close(): void {
        for (const closeHandler of closeHandlers) closeHandler()
      }

      onExit(close)

      if (params.noBlocking) return { close }
      else await new Promise(() => {})
    })
}

async function _checkPorts(config: AragonConfig): Promise<void> {
  if (await tcpPortUsed.check(config.clientServePort)) {
    throw new BuidlerPluginError(
      `Cannot start client. Port ${config.clientServePort} is in use.`
    )
  }

  if (await tcpPortUsed.check(config.appServePort)) {
    throw new BuidlerPluginError(
      `Cannot serve app. Port ${config.appServePort} is in use.`
    )
  }
}

async function _checkScripts(appSrcPath: string): Promise<void> {
  const appPackageJson = readJson(path.join(appSrcPath, 'package.json'))
  _checkScript(appPackageJson, 'sync-assets')
  _checkScript(appPackageJson, 'watch')
  _checkScript(appPackageJson, 'serve')
}

function _checkScript(json: any, script: string): void {
  if (!json.scripts[script]) {
    throw new BuidlerPluginError(
      `Missing script "${script}" in app/package.json.`
    )
  }
}
