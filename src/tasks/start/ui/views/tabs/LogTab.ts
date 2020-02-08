import blessed from 'blessed'
import Tab from './Tab'

export default class LogTab extends Tab {
  logger: any

  constructor(screen) {
    super(screen, 'Log')

    this.logger = blessed.log({
      parent: this.box,
      top: 'center',
      left: 'center',
      width: '98%',
      height: '98%',
      border: 'bg',
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
