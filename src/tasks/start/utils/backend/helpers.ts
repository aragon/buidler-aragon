import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'

export const getLog = (
  receipt: Truffle.TransactionResponse,
  logName: string,
  argName: string
): string => {
  const log = receipt.logs.find(({ event }) => event === logName)
  if (!log) {
    throw new BuidlerPluginError(
      `Cannot find proxy address. Unable to find ${logName} log.`
    )
  }
  return log.args[argName]
}
