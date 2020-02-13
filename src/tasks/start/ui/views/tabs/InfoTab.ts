import Tab from './Tab'

export default class InfoTab extends Tab {
  _data = {
    appName: '',
    appEns: '',
    appId: '',
    appAddress: '',
    daoAddress: '',
    url: '',
    contentUrl: '',
    ensAddress: '',
    apmAddress: '',
    repoVersion: '',
    repoAddress: '',
    implementationAddress: '',
    accountsMnemonic: '',
    accounts: []
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
      const sectionColor = 'red'
      content +=
        `  {${sectionColor}-fg}{bold}${name}{/${sectionColor}-fg}{/bold}` + '\n'
    }

    function closeSection(): void {
      content += '\n'
    }

    function entry(name, value): void {
      let tagColor = 'gray'
      if (value.length > 0) {
        tagColor = 'blue'
      }
      content +=
        `    {${tagColor}-fg}{bold}${name}{/${tagColor}-fg}{/bold} ${value}` +
        '\n'
    }

    // Application.
    section('Application')
    entry('name', this._data.appName)
    entry('ens name', this._data.appEns)
    entry('app id', this._data.appId)
    entry('proxy address', this._data.appAddress)
    entry('implementation address', this._data.implementationAddress)
    closeSection()

    // Accounts.
    section('Accounts')
    entry('mnemonic', this._data.accountsMnemonic)
    for (let i = 0; i < this._data.accounts.length; i++) {
      const account: any = this._data.accounts[i]
      if (account) {
        entry(`account ${i}`, account.publicKey)
        entry('         ', account.privateKey)
      }
    }
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
