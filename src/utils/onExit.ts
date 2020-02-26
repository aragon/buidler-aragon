/**
 * Register a callback that will be called when the process is interrupted.
 * Should be used by watchers to clean their fs.watch instances
 * @param callback ```
 * () => { watcher.close() }
 * ```
 */
export default function onExit(callback: () => void): void {
  process.on('exit', callback)
  process.on('SIGINT', callback)
  process.on('SIGUSR1', callback)
  process.on('SIGUSR2', callback)
  process.on('uncaughtException', callback)
  process.on('uncaughtException', callback)
}
