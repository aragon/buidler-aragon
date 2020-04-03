import fs from 'fs'
import path from 'path'

/**
 * Copy external artifacts to the local artifacts folder
 * This is a temporary hack until multiple artifacts paths are allowed
 * @param externalArtifactsPath 'node_modules/@aragon/abis/os/artifacts'
 */
export function copyExternalArtifacts(
  externalArtifactsPath: string,
  localArtifactsPath = 'artifacts'
): void {
  const fromDir = path.resolve(externalArtifactsPath)
  const toDir = path.resolve(localArtifactsPath)
  if (!fs.existsSync(fromDir))
    throw Error(
      `Can not copy external artifacts from ${fromDir}, does not exist`
    )

  for (const file of fs.readdirSync(fromDir)) {
    const from = path.join(fromDir, file)
    const to = path.join(toDir, file)
    if (!fs.existsSync(to)) fs.copyFileSync(from, to)
  }
}
