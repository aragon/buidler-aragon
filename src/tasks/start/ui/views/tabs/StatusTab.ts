import Tab from './Tab'
import blessed from 'blessed'

export default class StatusTab extends Tab {
  boxTop: any
  boxBottom: any

  constructor(screen, container) {
    super(screen, container, 'Status')

    this.boxTop = blessed.box({
      parent: this.box,
      top: 0,
      right: 0,
      left: 0,
      height: '48%',
      border: 'line',
      content:
        '{green-fg}{bold}✓{/green-fg}{/bold} Front end built\n{green-fg}{bold}✓{/green-fg}{/bold} Client served',
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
      content:
        '{green-fg}{bold}✓{/green-fg}{/bold} Back end built\n{green-fg}{bold}✓{/green-fg}{/bold} Implementation updated',
      tags: true,
      label: 'Back end'
    })
  }
}
