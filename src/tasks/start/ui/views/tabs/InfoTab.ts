import Tab from './Tab'

export default class InfoTab extends Tab {
  _data = {
    appName: '?',
    appEns: '?.aragonpm.eth',
    appId: '?',
    appAddress: '?',
    daoAddress: '?'
  }

  constructor(screen) {
    super(screen, 'Info')

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
    let content = ''
    content += `app name: ${this._data.appName}` + '\n'
    content += `app ens: ${this._data.appEns}` + '\n'
    content += `app id: ${this._data.appId}` + '\n'
    content += `app address: ${this._data.appAddress}` + '\n'
    content += `dao address: ${this._data.daoAddress}` + '\n'

    this.box.setContent(content)

    this.screen.render()
  }
}
