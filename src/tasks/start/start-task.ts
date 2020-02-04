import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { TASK_START } from '../task-names'
import { getAppId } from './utils/id'
import { logMain } from './utils/logger'
import { getAppName, getAppEnsName } from './utils/arapp'
import { startBackend } from './utils/backend/backend'
import { startFrontend } from './utils/frontend/frontend'
import { AragonConfig } from '~/src/types'
import tcpPortUsed from 'tcp-port-used'
import fsExtra from 'fs-extra'
import path from 'path'

/**
 * Main, composite, task. Calls startBackend, then startFrontend,
 * and then returns an unresolving promise to keep the task open.
 */
task(TASK_START, 'Starts Aragon app development')
  .addParam(
    'openBrowser',
    'Wether or not to automatically open a browser tab with the client',
    true,
    types.boolean
  )
  .setAction(async (params, bre: BuidlerRuntimeEnvironment) => {
    logMain(`Starting...`)

    const appEnsName = await getAppEnsName()
    const appName = await getAppName()
    const appId: string = getAppId(appEnsName)
    logMain(`App name: ${appName}`)
    logMain(`App ens name: ${appEnsName}`)
    logMain(`App id: ${appId}`)

    const config: AragonConfig = bre.config.aragon as AragonConfig
    await _checkPorts(config)
    await _checkScripts(config.appSrcPath as string)

    const { daoAddress, appAddress } = await startBackend(bre, appName, appId)
    await startFrontend(bre, daoAddress, appAddress, params.openBrowser)
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
