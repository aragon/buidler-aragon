import execa from 'execa'

/**
 * Calls the app's front end build watcher.
 */
export async function startAppWatcher(appSrcPath: string): Promise<void> {
  await execa('npm', ['run', 'watch'], { cwd: appSrcPath })
}
