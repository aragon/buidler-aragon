import blessed from 'blessed'
import { Writable } from 'stream'
import InfoTab from './views/tabs/InfoTab'
import LogTab from './views/tabs/LogTab'
import TabBar from './views/TabBar'
import ActivityBar from './views/ActivityBar'

let screen
let infoTab, logTab, activityBar

export function initialize(): void {
  screen = blessed.screen({
    smartCSR: true,
    debug: true
  })
  screen.title = 'Aragon - start task'

  // Disable console output that could occur from
  // running sub-processes.
  // eslint-disable-next-line no-console
  console = new console.Console(new Writable())

  // Route console logs to the screen debugger.
  // eslint-disable-next-line no-console
  console.log = (...args): void => screen.debug(`${args.join(' ')}`)

  infoTab = new InfoTab(screen)
  logTab = new LogTab(screen)

  const tabs: any[] = []
  tabs.push(infoTab)
  tabs.push(logTab)

  new TabBar(screen, tabs)

  activityBar = new ActivityBar(screen)

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0)
  })

  screen.render()
}

export function setInfo(data): void {
  infoTab.data = data
}

export function logActivity(msg): void {
  activityBar.update(msg)
  logTab.update(msg)
}
