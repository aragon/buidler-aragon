const blessed = require('blessed')
const { Writable } = require('stream')

let screen
let infoBox, logBox

function startRendering() {
  // _disableConsole()

  screen = blessed.screen()
  screen.title = 'Aragon - start task'

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0)
  })

  infoBox = blessed.box({
    parent: screen,
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    content: 'info'
  });
  screen.append(infoBox)
  infoBox.focus()

  logBox = blessed.box({
    parent: screen,
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    content: 'logs'
  });
  screen.append(logBox)
  logBox.hidden = true

  screen.key(['1'], function(ch, key) {
    infoBox.hidden = false
    logBox.hidden = true
    infoBox.focus()
    screen.render()
  })

  screen.key(['2'], function(ch, key) {
    infoBox.hidden = true
    logBox.hidden = false
    logBox.focus()
    screen.render()
  })

  screen.render()
}

function _disableConsole() {
  // eslint-disable-next-line no-console
  console = new console.Console(new Writable())
}

function setInfoAppName(appName) {
  infoBox.setContent(`info\n app name: ${appName}`)
  screen.render()
}

module.exports = {
  startRendering,
  setInfoAppName
}
