import blessed from 'blessed'

export default function showPopUpWithTimeout(screen): void {
  const question = blessed.question({
    parent: screen,
    border: 'line',
    height: 'shrink',
    width: 'half',
    top: 'center',
    left: 'center',
    label: ' {blue-fg}Question{/blue-fg} ',
    tags: true,
    keys: true,
    vi: true
  })

  const msg = blessed.message({
    parent: screen,
    border: 'line',
    height: 'shrink',
    width: 'half',
    top: 'center',
    left: 'center',
    label: ' {blue-fg}Message{/blue-fg} ',
    tags: true,
    keys: true,
    hidden: true,
    vi: true
  })

  const loader = blessed.loading({
    parent: screen,
    border: 'line',
    height: 'shrink',
    width: 'half',
    top: 'center',
    left: 'center',
    label: ' {blue-fg}Loader{/blue-fg} ',
    tags: true,
    keys: true,
    hidden: true,
    vi: true
  })

  setTimeout(() => {
    question.ask(
      'A new version of the Aragon Buidler plugin is available, would you like to update now?\n',
      function(err, value) {
        msg.display(
          'OK!! Installing Aragon Buidler plugin v7.8.64',
          3,
          function(err) {
            loader.load('Installation in progress...')
            setTimeout(function() {
              loader.stop()
            }, 3000)
          }
        )
      }
    )
  }, 20000)
}
