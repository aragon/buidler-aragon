import Tab from './Tab'
import blessed from 'blessed'

export default class TerminalTab extends Tab {
  screen: any
  boxTop: any
  boxBottom: any

  constructor(screen, container) {
    super(screen, container, 'Repl')

    /* const terminal = blessed.terminal({ */
    /*   parent: this.box, */
    /*   // cursor: 'line', */
    /*   cursorBlink: true, */
    /*   screenKeys: false, */
    /*   top: 'center', */
    /*   left: 'center', */
    /*   width: '99%', */
    /*   height: '90%', */
    /*   border: 'bg', */
    /*   handler: function() {}, */
    /*   style: { */
    /*     fg: 'default', */
    /*     bg: 'default', */
    /*     focus: { */
    /*       border: { */
    /*         fg: 'green' */
    /*       } */
    /*     } */
    /*   } */
    /* }) */

    /* terminal.focus() */
  }
}
