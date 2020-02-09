import blessed from 'blessed'
import Tab from './Tab'

export default class LogTab extends Tab {
  logger: any

  constructor(screen, container) {
    super(screen, container, 'Log')

    this.logger = blessed.log({
      parent: this.box,
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollback: 100,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          inverse: true
        }
      }
    })
  }

  update(msg: string): void {
    this.logger.log(msg)

    this.screen.render()
  }
}
