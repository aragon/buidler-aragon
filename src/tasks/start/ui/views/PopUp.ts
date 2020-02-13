import blessed from 'blessed'

export default function showPopUpWithTimeout(screen): void {
  const prompt = blessed.prompt({
    parent: screen,
    border: 'line',
    height: 'shrink',
    width: 'half',
    top: 'center',
    left: 'center',
    label: ' {blue-fg}Prompt{/blue-fg} ',
    tags: true,
    keys: true,
    vi: true
  })

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
    /* prompt.input( */
    /* 'A new version of the Aragon Buidler plugin is available, would you like to update now?', */
    /* '', */
    /* function(err, value) { */
    question.ask(
      'A new version of the Aragon Buidler plugin is available, would you like to update now?\n',
      function(err, value) {
        msg.display(
          'OK!! Installing Aragon Buidler plugin v7.8.64',
          3,
          function(err) {
            /* msg.display('Ok, installing!', -1, function(err) { */
            loader.load('Installation in progress...')
            setTimeout(function() {
              loader.stop()
              /* screen.destroy() */
            }, 3000)
            /* }) */
          }
        )
      }
    )
    /* } */
    /* ) */
  }, 20000)
}
