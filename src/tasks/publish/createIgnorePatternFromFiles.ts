import { readFileIfExists } from '../../utils/fsUtils'

/**
 * Reads ignore files from disk and aggregates their glob patterns
 * into a single array
 * @param rootPath Dir to find ignore files
 */
export default function createIgnorePatternFromFiles(
  rootPath: string
): string[] {
  const ignorePatterns: string[] = []
  for (const filename of ['.ipfsignore', '.gitignore']) {
    const data = readFileIfExists(rootPath, filename)
    if (data) {
      const ignoreLines = data
        .trim()
        .split('\n')
        .filter(l => l.trim())
      ignorePatterns.push(...ignoreLines)
    }
  }
  return ignorePatterns
}
