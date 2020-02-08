import chalk from 'chalk'
import * as Ui from '../ui/ui'

const mainTag = chalk.gray('main | ')
const frontTag = chalk.yellow('frontend | ')
const backTag = chalk.blue('backend  | ')

function _prependTag(lines: string, tag: string): string {
  return lines
    .split('\n')
    .map(line => tag + line)
    .join('\n')
}

export function logMain(data: string): void {
  // eslint-disable-next-line no-console
  /* console.log(_prependTag(data, mainTag)) */
  Ui.logActivity(data)
}

export function logFront(data: string): void {
  // eslint-disable-next-line no-console
  /* console.log(_prependTag(data, frontTag)) */
  Ui.logActivity(data)
}

export function logBack(data: string): void {
  // eslint-disable-next-line no-console
  /* console.log(_prependTag(data, backTag)) */
  Ui.logActivity(data)
}
