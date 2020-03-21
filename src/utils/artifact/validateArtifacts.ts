import path from 'path'
import { BuidlerPluginError } from '@nomiclabs/buidler/plugins'
import {
  artifactName,
  manifestName,
  flatCodeName,
  arappName
} from '../../params'
import { readFile, readJson } from '../../utils/fsUtils'
import { AragonArtifact, AragonManifest } from '~/src/types'
import { matchContractRoles } from './matchContractRoles'
import { findMissingManifestFiles } from './findMissingManifestFiles'
import { parseContractFunctions } from '~/src/utils/ast'

/**
 * Validates a release directory. Throws if there are issues
 * - Make sure contract roles match arapp.json roles
 * - Make sure filepaths in the manifest exist
 */
export function validateArtifacts(distPath: string): void {
  // Load files straight from the dist directory
  const artifact = readJson<AragonArtifact>(path.join(distPath, artifactName))
  const manifest = readJson<AragonManifest>(path.join(distPath, manifestName))
  const flatCode = readFile(path.join(distPath, flatCodeName))
  const functions = parseContractFunctions(flatCode, artifact.path)

  // Make sure all declared files in the manifest are there
  const missingFiles = findMissingManifestFiles(manifest, distPath)
  if (missingFiles.length)
    throw new BuidlerPluginError(
      `
Some files declared in manifest.json are not found in dist dir: ${distPath}
${missingFiles.map(file => ` - ${file.id}: ${file.path}`).join('\n')}
      
Make sure your app build process includes them in the dist directory on
every run of the designated NPM build script
`
    )

  // Make sure that the roles in the contract match the ones in arapp.json
  const roleMatchErrors = matchContractRoles(functions, artifact.roles)
  if (roleMatchErrors.length)
    throw new BuidlerPluginError(
      `
Some contract roles do not match declared roles in ${arappName}:
${roleMatchErrors.map(err => ` - ${err.id}: ${err.message}`).join('\n')}
`
    )
}
