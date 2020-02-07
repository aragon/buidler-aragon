// The Aragon web client expects certain parameters to work locally:
// - Local testnet node to connect to (testnetPort)
// - ENS address to resolve names (aragenMnemonic)
// In order to deploy the Aragon bases a specific gas limit is needed (aragenGasLimit).
export const testnetPort = 8545
export const aragenGasLimit = 10e6
export const aragenMnemonic =
  'explain tackle mirror kit van hammer degree position ginger unfair soup bonus'

// The above mnemonic with a specific sequence results in the below addresses.
export const defaultLocalAragonBases = {
  ensAddress: '0x5f6F7E8cc7346a11ca2dEf8f827b7a0b612c56a1',
  daoFactoryAddress: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0',
  apmAddress: '0xA53dE0b8e08b798f975D57f48384C177D410d170'
}
