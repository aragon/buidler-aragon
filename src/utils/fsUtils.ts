import fs from 'fs'
import path from 'path'

const joinPaths = (filepaths: string[]): string =>
  path.join(...filepaths.filter(Boolean))

/**
 * tests whether or not the given path exists by checking with the file system.
 * @param filepaths Joins all arguments as file paths
 * ```js
 * pathExists("dir", "file.ext")
 * ```
 */
export const pathExists = (...filepaths: string[]): boolean =>
  fs.existsSync(joinPaths(filepaths))

/**
 * Read file contents as a string (UTF-8)
 * @param filepaths Joins all arguments as file paths
 * ```js
 * readFile("dir", "file.ext")
 * ```
 */
export const readFile = (...filepaths: string[]): string =>
  fs.readFileSync(joinPaths(filepaths), 'utf8')

/**
 * Read file contents as string or if the path doesn't exists returns undefined
 * @param filepaths Joins all arguments as file paths
 * ```js
 * readFileIfExists("dir", "file.ext")
 * ```
 */
export const readFileIfExists = (...filepaths: string[]): string | undefined =>
  pathExists(...filepaths) ? readFile(...filepaths) : undefined

/**
 * Write string data to file
 * @param filepath
 */
export const writeFile = (filepath: string, data: string): void =>
  fs.writeFileSync(filepath, data)

/**
 * Read file contents as JSON
 * @param filepaths Joins all arguments as file paths
 * ```js
 * readJson("dir", "file.ext")
 * ```
 */
export const readJson = <T>(...filepaths: string[]): T =>
  JSON.parse(readFile(...filepaths))

/**
 * Read file contents as JSON or if the path doesn't exists returns undefined
 * @param filepaths Joins all arguments as file paths
 * ```js
 * readJsonIfExists("dir", "file.ext")
 * ```
 */
export const readJsonIfExists = <T>(...filepaths: string[]): T | undefined =>
  pathExists(...filepaths) ? readJson<T>(...filepaths) : undefined

/**
 * Write JSON data to file
 * @param filepath
 * @param data
 */
export const writeJson = <T>(filepath: string, data: T): void =>
  writeFile(filepath, JSON.stringify(data, null, 2))

/**
 * If given path does not exists, creates a directory recursively
 * @param filepaths Joins all arguments as file paths
 * ```js
 * ensureDir("parent-dir", "dir")
 * ```
 */
export const ensureDir = (...filepaths: string[]): void => {
  const fullpath = joinPaths(filepaths)
  if (!pathExists(fullpath)) fs.mkdirSync(fullpath, { recursive: true })
}
