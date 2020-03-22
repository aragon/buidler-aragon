import fs from 'fs-extra'
import path from 'path'

const joinPaths = (filepaths: string | string[]): string =>
  Array.isArray(filepaths) ? path.join(...filepaths) : filepaths

/**
 * tests whether or not the given path exists by checking with the file system.
 * @param filepath path or array with paths to join with `path.join`
 * ```js
 * pathExists(["dir", "file.ext"])
 * ```
 */
export const pathExists = (filepath: string | string[]): boolean =>
  fs.existsSync(joinPaths(filepath))

/**
 * Read file contents as a string (UTF-8)
 * @param filepath path or array with paths to join with `path.join`
 * ```js
 * readFile(["dir", "file.ext"])
 * ```
 */
export const readFile = (filepath: string | string[]): string =>
  fs.readFileSync(joinPaths(filepath), 'utf8')

/**
 * Read file contents as string or if the path doesn't exists returns undefined
 * @param filepath path or array with paths to join with `path.join`
 * ```js
 * readFileIfExists(["dir", "file.ext"])
 * ```
 */
export const readFileIfExists = (
  filepath: string | string[]
): string | undefined => (pathExists(filepath) ? readFile(filepath) : undefined)

/**
 * Write string data to file
 * @param filepath
 */
export const writeFile = (filepath: string | string[], data: string): void =>
  fs.writeFileSync(joinPaths(filepath), data)

/**
 * Read file contents as JSON
 * @param filepath Joins all arguments as file paths
 * ```js
 * readJson(["dir", "file.ext"])
 * ```
 */
export const readJson = <T>(filepath: string | string[]): T =>
  fs.readJsonSync(joinPaths(filepath))

/**
 * Read file contents as JSON or if the path doesn't exists returns undefined
 * @param filepath path or array with paths to join with `path.join`
 * ```js
 * readJsonIfExists(["dir", "file.ext"])
 * ```
 */
export const readJsonIfExists = <T>(
  filepath: string | string[]
): T | undefined => (pathExists(filepath) ? readJson<T>(filepath) : undefined)

/**
 * Write JSON data to file
 * @param filepath
 * @param data
 */
export const writeJson = <T>(filepath: string | string[], data: T): void =>
  fs.writeJsonSync(joinPaths(filepath), data)

/**
 * If given path does not exists, creates a directory recursively
 * @param filepath path or array with paths to join with `path.join`
 * ```js
 * ensureDir(["parent-dir", "dir"])
 * ```
 */
export const ensureDir = (filepath: string | string[]): void =>
  fs.ensureDirSync(joinPaths(filepath))

/**
 * Removes a file or directory. The directory can have contents.
 * If the path does not exist, silently does nothing. Like rm -rf
 * @param filepath Joins all arguments as file paths
 */
export const remove = (filepath: string | string[]): void =>
  fs.removeSync(joinPaths(filepath))
