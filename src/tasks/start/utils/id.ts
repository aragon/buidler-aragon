import namehash from 'eth-ens-namehash'

export function getAppId(ensName: string): string {
  return namehash.hash(ensName)
}
