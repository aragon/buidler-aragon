import { ethers } from 'ethers'
import * as abis from '~/src/utils/apm/abis'

describe('apm > abis', () => {
  for (const [abiName, abi] of Object.entries(abis)) {
    it(`Should create an instance from ${abiName}`, () => {
      // Calling ethers.utils.Interface ensures the ABIs are valid
      // Since they are compiled at run time, check here
      new ethers.utils.Interface(abi)
    })
  }
})
