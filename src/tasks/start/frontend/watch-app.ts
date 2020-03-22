import execa from 'execa'

/**
 * Calls the app's front end build watcher.
 */
export async function startAppWatcher(
  appSrcPath: string
): Promise<{ close: () => void }> {
  const watchScriptApp = execa('npm', ['run', 'watch'], { cwd: appSrcPath })

  return {
    close: (): void => {
      watchScriptApp.kill('SIGTERM')
    }
  }
}
