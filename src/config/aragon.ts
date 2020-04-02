import { ConfigExtender } from '@nomiclabs/buidler/types'
import { AragonConfig } from '../types'
import { readArappIfExists } from '../utils/arappUtils'

export const defaultAragonConfig: AragonConfig = {
  appServePort: 8001,
  clientServePort: 3000,
  appSrcPath: 'app/',
  appBuildOutputPath: 'dist/',
  ignoreFilesPath: '.',
  ipfsGateway: 'https://ipfs.eth.aragon.network/ipfs/'
}

export const configExtender: ConfigExtender = (finalConfig, userConfig) => {
  // Apply defaults
  finalConfig.aragon = {
    ...defaultAragonConfig,
    ...(userConfig.aragon || {})
  }

  // Fetch network specific app names from arapp.json
  const arapp = readArappIfExists()
  if (arapp && typeof arapp.environments === 'object') {
    const appNames: { [network: string]: string } = {}
    for (const [network, env] of Object.entries(arapp.environments)) {
      if (env.appName) appNames[network] = env.appName
    }

    const userAppName = (userConfig.aragon || {}).appName
    const appNamesArr = Object.values(appNames)
    const thereAreNames = appNamesArr.length > 0
    const allNamesAreEqual = appNamesArr.every(name => name === appNamesArr[0])
    if (thereAreNames) {
      if (allNamesAreEqual) {
        // Only add it if it's not defined in the buidler.config
        if (!userAppName) {
          finalConfig.aragon.appName = appNamesArr[0]
        }
      } else {
        finalConfig.aragon.appName = {
          ...appNames,
          // Merge buidler config app names if any
          // If there's one single appName add it as "default"
          ...(typeof userAppName === 'object'
            ? userAppName
            : typeof userAppName === 'string'
            ? { default: userAppName }
            : {})
        }
      }
    }
  }
}
