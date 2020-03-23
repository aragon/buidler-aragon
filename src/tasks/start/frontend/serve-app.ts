import execa from 'execa'
import fetch from 'node-fetch'

/**
 * Starts the app's front end sever.
 */
export async function serveAppAndResolveWhenBuilt(
  appSrcPath: string,
  appServePort: number
): Promise<void> {
  // Trigger serving in app/.
  execa('npm', ['run', 'serve', '--', '--port', `${appServePort}`], {
    cwd: appSrcPath
  })

  // Query the server for an index.html file.
  // and resolve only when the file is found (with a timeout).
  const maxWaitingTime = 60 * 1000
  const startingTime = Date.now()
  while (Date.now() - startingTime < maxWaitingTime) {
    try {
      await fetch(`http://localhost:${appServePort}`, { timeout: 10 * 1000 })

      // Server is active and serving, resolve.
      return
    } catch (e) {
      // Ignore errors, at worse after maxWaitingTime this will resolve.
      // Pause for a bit to prevent performing requests too fast.
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}
