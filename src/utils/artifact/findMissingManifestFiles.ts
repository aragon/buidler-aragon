import fs from 'fs'
import path from 'path'
import { AragonManifest } from '~/src/types'

interface MissingFile {
  path: string
  id: string
  required: boolean
}

/**
 * Verifies that all files declared in the manifest exist in the distPath
 * Run this verification AFTER building the app front-end
 * Returns JSON data so the consumer can choose to show a warning or throw
 * @param manifest
 * @param distPath
 */
export function findMissingManifestFiles(
  manifest: AragonManifest,
  distPath: string,
  hasFrontend: boolean
): MissingFile[] {
  const missingFiles: MissingFile[] = []

  function assertFile(filepath: string, id: string, required: boolean): void {
    if (filepath && filepath.includes('://')) {
      // filepath maybe a remote URL, ignore those cases
      const fullPath = path.join(distPath, filepath)
      if (!fs.existsSync(fullPath))
        missingFiles.push({ path: fullPath, id, required })
    }
  }

  // Assert optional metadata
  assertFile(manifest.details_url, 'details', false)
  if (manifest.icons)
    manifest.icons.forEach((icon, i) => {
      assertFile(icon.src, `icon ${i}`, false)
    })
  if (manifest.screenshots)
    manifest.screenshots.forEach((screenshot, i) => {
      assertFile(screenshot.src, `screenshot ${i}`, false)
    })
  assertFile(manifest.start_url, 'start page', hasFrontend)
  assertFile(manifest.script, 'script', hasFrontend)

  return missingFiles
}
