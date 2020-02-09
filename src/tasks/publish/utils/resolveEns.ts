import ENS from 'ethjs-ens'

/**
 * Initialize and Ens instance to resolve names or nodes
 * @param options
 */
export function Ens(options: {
  registryAddress: string
  provider: any
}): { lookup: (nameOrNode: string) => Promise<string> } {
  // Stupid hack for ethjs-ens
  if (!options.provider.sendAsync) {
    options.provider.sendAsync = options.provider.send
  }

  const ens = new ENS(options)
  return {
    lookup: async (nameOrNode: string): Promise<string> => {
      try {
        return await ens.lookup(nameOrNode)
      } catch (e) {
        if (e.message.includes('name not defined')) return ''
        else throw e
      }
    }
  }
}

/**
 * Shortcut to resolveEns without the initialized object
 * @param nameOrNode
 * @param options
 */
export async function resolveEns(
  nameOrNode: string,
  options: { registryAddress: string; provider: any }
): Promise<string> {
  const ens = Ens(options)
  return await ens.lookup(nameOrNode)
}

/**
 * Compute the ENS namehash of a name
 * @param name "aragonpm.eth"
 * @return "0x9065c3e7f7b7ef1ef4e53d2d0b8e0cef02874ab020c1ece79d5f0d3d0111c0ba"
 */
export function namehash(name: string): string {
  // Mock initialization to access the internal `namehash` function
  const ens = new ENS({ provider: {}, registryAddress: '0x' })
  return ens.namehash(name)
}
