import blessed from 'blessed'

export default class ErrorPopUp {
  constructor(screen: any, msg: string) {
    blessed.box({
      parent: screen,
      left: 'center',
      top: 'center',
      width: '50%',
      height: '50%',
      style: {
        bg: 'red'
      },
      border: 'line',
      tags: true,
      content: `Error!\n${msg}`
    })
  }
}
