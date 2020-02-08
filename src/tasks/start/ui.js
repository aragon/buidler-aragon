const blessed = require('blessed')
const { Writable } = require('stream')

const Ui = (function() {
  let instance
  let screen
  let boxes, infoBox, logBox, activity

  function _createBox(label) {
    const box = blessed.box({
      parent: screen,
      top: 0,
      right: 0,
      width: '100%',
      height: 7,
      border: 'bg',
      content: '',
      label
    })

    box.hidden = true

    screen.append(box)

    boxes.push(box)

    return box
  }

  function _showBox(box) {
    boxes.forEach(box => (box.hidden = true))

    box.hidden = false

    screen.render()
  }

  function createInstance() {
    _disableConsole()

    boxes = []

    screen = blessed.screen()
    screen.title = 'Aragon - start task'

    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
      return process.exit(0)
    })

    infoBox = _createBox('info')
    logBox = _createBox('logs')
    _showBox(infoBox)

    const bar = blessed.listbar({
      label: 'tabs',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      mouse: true,
      keys: true,
      border: 'line',
      vi: true,
      style: {
        item: {
          hover: {
            bg: 'blue'
          }
        },
        selected: {
          bg: 'red'
        }
      },
      commands: {
        info: {
          keys: ['1'],
          callback: function() {
            _showBox(infoBox)
          }
        },
        logs: {
          keys: ['2'],
          callback: function() {
            _showBox(logBox)
          }
        }
      }
    })
    screen.append(bar)
    bar.focus()

    activity = blessed.box({
      parent: screen,
      bottom: 3,
      left: 0,
      right: 0,
      width: '100%',
      height: 3,
      border: 'line',
      content: 'waiting...',
      label: 'activity'
    })

    screen.key(['right'], function(ch, key) {
      bar.moveRight(1)
    })

    screen.render()

    // This is the actual Ui instance.
    return {
      setInfoBoxData,
      logActivity
    }
  }

  function _disableConsole() {
    // eslint-disable-next-line no-console
    console = new console.Console(new Writable())
  }

  function setInfoBoxData(data) {
    infoBoxData = {
      ...infoBoxData,
      ...data
    }
    _buildInfoContent()
  }

  let infoBoxData = {
    appName: '?',
    appEns: '?.aragonpm.eth',
    appId: '?',
    appAddress: '?',
    daoAddress: '?'
  }
  function _buildInfoContent() {
    let content = ''
    content += `app name: ${infoBoxData.appName}` + '\n'
    content += `app ens: ${infoBoxData.appEns}` + '\n'
    content += `app id: ${infoBoxData.appId}` + '\n'
    content += `app address: ${infoBoxData.appAddress}` + '\n'
    content += `dao address: ${infoBoxData.daoAddress}` + '\n'
    infoBox.setContent(content)
    screen.render()
  }

  function logActivity(msg) {
    activity.setContent(`> ${msg}`)
    screen.render()
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance()
      }

      return instance
    }
  }
})()


module.exports = {
  Ui
}
