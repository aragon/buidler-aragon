import blessed from 'blessed'
import InfoTab from './views/tabs/InfoTab'
import LogTab from './views/tabs/LogTab'
import TabBar from './views/TabBar'
import ActivityBar from './views/ActivityBar'
import ErrorPopUp from './views/ErrorPopUp'

let screen
let infoTab, logTab, activityBar

export function initialize(): void {
  /* const processAsEmitter = process as NodeJS.EventEmitter */
  /* processAsEmitter.on('uncaughtException', (err, origin) => { */
  /*   // eslint-disable-next-line no-console */
  /*   console.error(`${err.message}\n${origin}`) */
  /* }) */

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

  const tabs: any[] = []
  tabs.push(infoTab)
  tabs.push(logTab)

  new TabBar(screen, tabs)

  activityBar = new ActivityBar(screen)

  // Hijack console functions.
  // eslint-disable-next-line no-console
  console.log = (...args): void => screen.debug(`${args.join(' ')}`)
  // eslint-disable-next-line no-console
  /* console.error = (msg: string): void => showError(msg) */

  screen.key(['escape', 'q', 'C-c'], function() {
    return process.exit(0)
  })

  screen.render()
}

export function setInfo(data): void {
  infoTab.data = data
}

export function logActivity(msg: string): void {
  activityBar.update(msg)
  logTab.update(msg)
}

export function showError(msg: string): void {
  new ErrorPopUp(screen, msg)
}
