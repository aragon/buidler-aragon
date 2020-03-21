import fs from 'fs'

/**
 * Read file contents as a string (UTF-8)
 * @param filepath
 */
export const readFile = (filepath: string): string =>
  fs.readFileSync(filepath, 'utf8')

/**
 * Read file contents as string or if the path doesn't exists returns undefined
 * @param filepath
 */
export const readFileIfExists = (filepath: string): string | undefined =>
  fs.existsSync(filepath) ? readFile(filepath) : undefined

/**
 * Write string data to file
 * @param filepath
 */
export const writeFile = (filepath: string, data: string): void =>
  fs.writeFileSync(filepath, data)

/**
 * Read file contents as JSON
 * @param filepath
 */
export const readJson = <T>(filepath: string): T =>
  JSON.parse(readFile(filepath))

/**
 * Read file contents as JSON or if the path doesn't exists returns undefined
 * @param filepath
 */
export const readJsonIfExists = <T>(filepath: string): T | undefined =>
  fs.existsSync(filepath) ? readJson<T>(filepath) : undefined

/**
 * Write JSON data to file
 * @param filepath
 * @param data
 */
export const writeJson = <T>(filepath: string, data: T): void =>
  writeFile(filepath, JSON.stringify(data, null, 2))
