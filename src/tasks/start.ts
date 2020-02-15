import { task } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { TASK_START } from './task-names'
import { logMain } from '../ui/logger'
import { startBackend } from './start/backend/backend'
import { startFrontend } from './start/frontend/frontend'
import { AragonConfig } from '~/src/types'
import tcpPortUsed from 'tcp-port-used'
import fsExtra from 'fs-extra'
import path from 'path'
import { aragenMnemonic, aragenAccounts } from '../params'
import { getAppName, getAppEnsName, getAppId } from '../utils/arappUtils'
import { validateEnsName } from '../utils/validateEnsName'

/**
 * Main, composite, task. Calls startBackend, then startFrontend,
 * and then returns an unresolving promise to keep the task open.
 */
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

    const appEnsName = await getAppEnsName()
    const appName = await getAppName()
    const appId: string = getAppId(appEnsName)
    logMain(`App name: ${appName}
App ens name: ${appEnsName}
App id: ${appId}`)

    let accountsStr = ''
    for (let i = 0; i < aragenAccounts.length; i++) {
      const account = aragenAccounts[i]
      accountsStr += `Account ${i} private key ${account.privateKey}\n`
      accountsStr += `           public key ${account.publicKey}\n`
    }
    logMain(`Accounts mnemonic "${aragenMnemonic}"
${accountsStr}`)

    if (!validateEnsName(appEnsName)) {
      throw new BuidlerPluginError(
        `Invalid ENS name "${appEnsName}" found in arapp.json (environments.default.appName). Only ENS names in the form "<name>.aragonpm.eth" are supported in development. Please change the value in environments.default.appName, in your project's arapp.json file. Note: Non-development environments are ignored in development and don't have this restriction.`
      )
    }

    const config: AragonConfig = bre.config.aragon as AragonConfig
    await _checkPorts(config)
    await _checkScripts(config.appSrcPath as string)

    const { daoAddress, appAddress } = await startBackend(
      bre,
      appName,
      appId,
      params.silent
    )
    await startFrontend(bre, daoAddress, appAddress, !params.noBrowser)
  })

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
  const appPackageJson = await fsExtra.readJson(
    path.join(appSrcPath, 'package.json')
  )

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
