import execa from 'execa'

/**
 * Calls the app's aragon/ui copy-aragon-ui-assets script.
 */
export async function copyAppUiAssets(appSrcPath: string): Promise<void> {
  await execa('npm', ['run', 'sync-assets'], { cwd: appSrcPath })
}
