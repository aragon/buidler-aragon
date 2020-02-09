import blessed from 'blessed'

export default class Tab {
  screen: any
  box: any

  _label: string

  constructor(screen, container, label: string) {
    this.screen = screen
    this._label = label

    this.box = blessed.box({
      parent: container,
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      border: 'line',
      content: '',
      label
    })

    this.box.hidden = true

    /* this.screen.append(this.box) */
    container.append(this.box)
  }

  set hidden(value: boolean) {
    this.box.hidden = value
  }

  get label(): string {
    return this._label
  }
}
