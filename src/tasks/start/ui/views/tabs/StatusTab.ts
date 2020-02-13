import Tab from './Tab'
import blessed from 'blessed'

export default class StatusTab extends Tab {
  screen: any
  boxTop: any
  boxBottom: any

  constructor(screen, container) {
    super(screen, container, 'Status')

    this.screen = screen

    this.boxTop = blessed.box({
      parent: this.box,
      top: 0,
      right: 0,
      left: 0,
      height: '48%',
      border: 'line',
      content: '✓ Front end built\n✓Client served',
      tags: true,
      label: 'Front end'
    })

    this.boxBottom = blessed.box({
      parent: this.box,
      bottom: 0,
      right: 0,
      left: 0,
      height: '48%',
      border: 'line',
      content: '✓ Back end built\n✓ Implementation updated',
      tags: true,
      label: 'Back end'
    })
  }
}
