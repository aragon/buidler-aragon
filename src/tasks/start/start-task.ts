import { task, types } from '@nomiclabs/buidler/config'
import { BuidlerRuntimeEnvironment } from '@nomiclabs/buidler/types'
import { TASK_START } from '../task-names'
import { getAppId } from './utils/id'
import { logMain } from './utils/logger'
import { getAppName, getAppEnsName } from './utils/arapp'
import { startBackend } from './utils/backend/backend'
import { startFrontend } from './utils/frontend/frontend'

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
    const appId: string = getAppId(appName)
    logMain(`App name: ${appName}`)
    logMain(`App ens name: ${appEnsName}`)
    logMain(`App id: ${appId}`)

    const { daoAddress, appAddress } = await startBackend(bre, appName, appId)
    await startFrontend(bre, daoAddress, appAddress, params.openBrowser)
  })
