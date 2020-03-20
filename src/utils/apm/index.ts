import { ethers } from 'ethers'
import { Publish } from './publish'
import { Repo } from './repo'

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export function Apm(
  provider: ethers.providers.Provider,
  options?: { ipfsGateway?: string }
) {
  return {
    ...Repo(provider, options),
    ...Publish(provider)
  }
}
