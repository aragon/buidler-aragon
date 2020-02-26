export default function onExit(callback: () => void): void {
  process.on('exit', callback)
  process.on('SIGINT', callback)
  process.on('SIGUSR1', callback)
  process.on('SIGUSR2', callback)
  process.on('uncaughtException', callback)
  process.on('uncaughtException', callback)
}
