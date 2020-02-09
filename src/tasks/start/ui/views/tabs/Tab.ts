import blessed from 'blessed'

export default class Tab {
  screen: any
  box: any

  _label: string

  constructor(screen, label: string) {
    this.screen = screen
    this._label = label

    this.box = blessed.box({
      parent: this.screen,
      top: 0,
      right: 0,
      width: '100%',
      height: '100%',
      border: 'bg',
      content: '',
      bg: 'black',
      mouse: false,
      label: `~ ${label} ~`
    })

    this.box.hidden = true

    this.screen.append(this.box)
  }

  set hidden(value: boolean) {
    this.box.hidden = value
  }

  get label(): string {
    return this._label
  }
}
