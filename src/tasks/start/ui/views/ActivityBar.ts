import blessed from 'blessed'

export default class ActivityBar {
  screen: any
  box: any

  constructor(screen: any) {
    this.screen = screen

    this.box = blessed.box({
      parent: screen,
      bottom: 3,
      left: 0,
      right: 0,
      width: '100%',
      height: 3,
      border: 'line',
      content: 'waiting...',
      label: 'Activity'
    })
  }

  update(msg: string): void {
    this.box.setContent(`> ${msg}`)

    this.screen.render()
  }
}
