import blessed from 'blessed'

export default class TabBar {
  screen: any
  tabs: any[]

  constructor(screen: any, tabs: any[]) {
    this.screen = screen
    this.tabs = tabs

    const bar = blessed.listbar({
      label: 'Tabs',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      mouse: true,
      keys: true,
      border: 'line',
      autoCommandKeys: true,
      vi: true,
      style: {
        item: {
          hover: {
            bg: 'gray'
          }
        },
        selected: {
          bg: 'red'
        }
      }
    })

    const commands = {}
    tabs.forEach(tab => {
      commands[tab.label] = (): void => this._showTab(tab)
    })
    bar.setItems(commands)

    screen.append(bar)

    bar.focus()

    screen.key(['right'], function() {
      bar.moveRight(1)
    })

    screen.key(['left'], function() {
      bar.moveLeft(1)
    })

    this._showTab(tabs[0])
  }

  _showTab(tab): void {
    this.tabs.forEach(tab => (tab.hidden = true))

    tab.hidden = false

    this.screen.render()
  }
}
