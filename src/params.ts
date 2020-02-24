import { AragonConfig } from './types'

// The Aragon web client expects certain parameters to work locally:
// - Local testnet node to connect to (testnetPort)
// - ENS address to resolve names (aragenMnemonic)
// In order to deploy the Aragon bases a specific gas limit is needed (aragenGasLimit).
export const testnetPort = 8545
export const aragenGasLimit = 10e6
export const aragenMnemonic =
  'explain tackle mirror kit van hammer degree position ginger unfair soup bonus'

const DEFAULT_BALANCE = '0x56bc75e2d63100000'
export const aragenAccounts = [
  {
    privateKey:
      '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0xce8e3bda3b44269c147747a373646393b1504bfcbb73fc9564f5d753d8116608',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x8716d2701596f51aa39d061a685d5ae5ec946eb2c7adb059d29024b5bb3b02c8',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x62d7bb725787d84b059eb4950f6eea060d898183250ca3ea673a36b8e113018f',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x705df2ae707e25fa37ca84461ac6eb83eb4921b653e98fdc594b60bea1bb4e52',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x6b12b45143fc6c7721d0ffbb9811905e773868376501fd1f46c64bf34ae29991',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x33f3f34569f997abb165d6967895d963a2b15ec609efcec844e65b60ee8340c7',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x5a013cc48f0a3196b0986fc7a7a9dd320ac75e89e33302a7ff4ea6b9dc4f7b00',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x418cc0b07bfef998f577384b185b97ad544204b5be43ac9b3abf16db2012ab5c',
    balance: DEFAULT_BALANCE
  },
  {
    privateKey:
      '0x698eece6f9915b08b4d1a63958dc4f3996ee5a8d685b29d17c28beab912a77cd',
    balance: DEFAULT_BALANCE
  }
]

// Note: this is not incuded in aragenAccounts because Buidler's types does
// not allow specifying a public key for accounts.
export const aragenAccountsInfo = (web3): any[] => {
  return aragenAccounts.map((account: any) => {
    account.publicKey = web3.eth.accounts.privateKeyToAccount(
      account.privateKey
    ).address

    return account
  })
}

// The above mnemonic with a specific sequence results in the below addresses.
export const defaultLocalAragonBases = {
  ensAddress: '0x5f6F7E8cc7346a11ca2dEf8f827b7a0b612c56a1',
  daoFactoryAddress: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0',
  apmAddress: '0xA53dE0b8e08b798f975D57f48384C177D410d170'
}

export const defaultAragonConfig: AragonConfig = {
  appServePort: 8001,
  clientServePort: 3000,
  appSrcPath: 'app/',
  appBuildOutputPath: 'dist/'
}
