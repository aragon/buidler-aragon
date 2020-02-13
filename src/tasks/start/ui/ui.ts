import blessed from 'blessed'
import InfoTab from './views/tabs/InfoTab'
import LogTab from './views/tabs/LogTab'
import StatusTab from './views/tabs/StatusTab'
import TabBar from './views/TabBar'
import ActivityBar from './views/ActivityBar'

let screen
let infoTab, logTab, statusTab, activityBar
let enabled

export function initialize(showUi): void {
  enabled = showUi
  if (!enabled) {
    return
  }

  screen = blessed.screen({
    smartCSR: true,
    debug: true,
    warnings: true
  })
  screen.title = 'Aragon - start task'

  const containerBottom = 6
  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: screen.height - containerBottom,
    content: '',
    bg: 'red'
  })
  screen.append(container)

  screen.on('resize', function() {
    container.height = screen.height - containerBottom
    screen.render()
  })

  infoTab = new InfoTab(screen, container)
  logTab = new LogTab(screen, container)
  statusTab = new StatusTab(screen, container)

  const tabs: any[] = []
  tabs.push(infoTab)
  tabs.push(statusTab)
  tabs.push(logTab)

  new TabBar(screen, tabs)

  activityBar = new ActivityBar(screen)

  // Hijack console functions.
  // eslint-disable-next-line no-console
  console.log = (...args): void => screen.debug(`${args.join(' ')}`)

  screen.key(['escape', 'q', 'C-c'], function() {
    return process.exit(0)
  })

  screen.render()
}

export function setInfo(data): void {
  if (!enabled) {
    // eslint-disable-next-line no-console
    console.log(data)
    return
  }

  infoTab.data = data
}

export function logActivity(msg: string): void {
  if (!enabled) {
    // eslint-disable-next-line no-console
    console.log(msg)
    return
  }

  activityBar.update(msg)
  logTab.update(msg)
}
