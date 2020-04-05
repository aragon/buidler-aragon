import fs from 'fs-extra'

/**
 * tests whether or not the given path exists by checking with the file system.
 * @param filepath path
 */
export const pathExists = (filepath: string): boolean => fs.existsSync(filepath)

/**
 * Read file contents as a string (UTF-8)
 * @param filepath path
 */
export const readFile = (filepath: string): string =>
  fs.readFileSync(filepath, 'utf8')

/**
 * Read file contents as string or if the path doesn't exists returns undefined
 * @param filepath path
 */
export const readFileIfExists = (filepath: string): string | undefined =>
  pathExists(filepath) ? readFile(filepath) : undefined

/**
 * Write string data to file
 * @param filepath
 */
export const writeFile = (filepath: string, data: string): void =>
  fs.writeFileSync(filepath, data)

/**
 * Read file contents as JSON
 * @param filepath path
 */
export const readJson = <T>(filepath: string): T => fs.readJsonSync(filepath)

/**
 * Read file contents as JSON or if the path doesn't exists returns undefined
 * @param filepath path
 */
export const readJsonIfExists = <T>(filepath: string): T | undefined =>
  pathExists(filepath) ? readJson<T>(filepath) : undefined

/**
 * Write JSON data to file
 * @param filepath path
 * @param data
 */
export const writeJson = <T>(filepath: string, data: T): void =>
  fs.writeJsonSync(filepath, data)

/**
 * If given path does not exists, creates a directory recursively
 * @param filepath path
 */
export const ensureDir = (filepath: string): void => fs.ensureDirSync(filepath)

/**
 * Removes a file or directory. The directory can have contents.
 * If the path does not exist, silently does nothing. Like rm -rf
 * @param filepath path
 */
export const remove = (filepath: string): void => fs.removeSync(filepath)
