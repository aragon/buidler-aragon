import fs from 'fs'

/**
 * Read file contents as a string (UTF-8)
 * @param filepath
 */
export const readFile = (filepath: string): string =>
  fs.readFileSync(filepath, 'utf8')

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
 * Write JSON data to file
 * @param filepath
 * @param data
 */
export const writeJson = <T>(filepath: string, data: T): void =>
  writeFile(filepath, JSON.stringify(data, null, 2))
