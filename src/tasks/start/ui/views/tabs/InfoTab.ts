import Tab from './Tab'

export default class InfoTab extends Tab {
  _data = {
    appName: '?',
    appEns: '?.aragonpm.eth',
    appId: '?',
    appAddress: 'not deployed',
    daoAddress: 'not deployed',
    url: 'client not started',
    contentUrl: 'content not served',
    ensAddress: 'not deployed',
    apmAddress: 'not deployed',
    repoVersion: 'not deployed',
    repoAddress: 'not deployed',
    implementationAddress: 'not deployed'
  }

  constructor(screen, container) {
    super(screen, container, 'Info')

    this._buildContent()
  }

  set data(value: any) {
    this._data = {
      ...this._data,
      ...value
    }

    this._buildContent()
  }

  _buildContent(): void {
    let content = '\n'

    function section(name): void {
      content += `  {blue-fg}{bold}${name}{/blue-fg}{/bold}` + '\n'
    }

    function closeSection(): void {
      content += '\n'
    }

    function entry(name, value): void {
      content += `    {gray-fg}{bold}${name}:{/gray-fg}{/bold} ${value}` + '\n'
    }

    // Application.
    section('Application')
    entry('name', this._data.appName)
    entry('ens name', this._data.appEns)
    entry('app id', this._data.appId)
    entry('proxy address', this._data.appAddress)
    entry('implementation address', this._data.implementationAddress)
    closeSection()

    // Repository.
    section('Repository')
    entry('address', this._data.repoAddress)
    entry('version', this._data.repoVersion)
    closeSection()

    // Dao.
    section('Dao')
    entry('address', this._data.daoAddress)
    closeSection()

    // Bases.
    section('Bases')
    entry('ens address', this._data.ensAddress)
    entry('apm address', this._data.apmAddress)
    closeSection()

    // Urls.
    section('Urls')
    entry('client url', this._data.url)
    entry('app url', this._data.contentUrl)
    closeSection()

    this.box.setContent(content)

    this.screen.render()
  }
}
