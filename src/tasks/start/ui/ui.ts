import blessed from 'blessed'
import { Writable } from 'stream'
import InfoTab from './views/tabs/InfoTab'
import LogTab from './views/tabs/LogTab'
import TabBar from './views/TabBar'
import ActivityBar from './views/ActivityBar'

let screen
let infoTab, logTab, activityBar

export function initialize(): void {
  _disableConsole()

  screen = blessed.screen()
  screen.title = 'Aragon - start task'

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

function _disableConsole(): void {
  // eslint-disable-next-line no-console
  console = new console.Console(new Writable())
}

export function setInfo(data): void {
  infoTab.data = data
}

export function logActivity(msg): void {
  activityBar.update(msg)
  logTab.update(msg)
}
