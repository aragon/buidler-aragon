import path from 'path'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import {
  artifactName,
  manifestName,
  flatCodeName,
  arappName
} from '~/src/params'
import { AragonArtifact, AragonManifest } from '~/src/types'
import { parseContractFunctions } from '~/src/utils/ast'
import { readFile, readJson } from '~/src/utils/fsUtils'
import { findMissingManifestFiles } from './findMissingManifestFiles'
import { matchContractRoles } from './matchContractRoles'

/**
 * Validates a release directory. Throws if there are issues
 * - Make sure contract roles match arapp.json roles
 * - Make sure filepaths in the manifest exist
 */
export function validateArtifacts(
  distPath: string,
  hasFrontend: boolean
): void {
  // Load files straight from the dist directory
  const artifact = readJson<AragonArtifact>(path.join(distPath, artifactName))
  const manifest = readJson<AragonManifest>(path.join(distPath, manifestName))
  const flatCode = readFile(path.join(distPath, flatCodeName))
  const functions = parseContractFunctions(flatCode, artifact.path)

  // Make sure all declared files in the manifest are there
  const missingFiles = findMissingManifestFiles(manifest, distPath, hasFrontend)
  if (missingFiles.length)
    throw new BuidlerPluginError(
      `
Some files declared in manifest.json are not found in dist dir: ${distPath}
${missingFiles.map(file => ` - ${file.id}: ${file.path}`).join('\n')}
      
Make sure your app build process includes them in the dist directory on
every run of the designated NPM build script.

If you are sure you want to publish anyway, use the flag "--skip-validation".
`
    )

  // Make sure that the roles in the contract match the ones in arapp.json
  const roleMatchErrors = matchContractRoles(functions, artifact.roles)
  if (roleMatchErrors.length)
    throw new BuidlerPluginError(
      `
Some contract roles do not match declared roles in ${arappName}:
${roleMatchErrors.map(err => ` - ${err.id}: ${err.message}`).join('\n')}

If you are sure you want to publish anyway, use the flag "--skip-validation".
`
    )
}
