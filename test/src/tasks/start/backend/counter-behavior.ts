import { assert } from 'chai'

export const itBehavesLikeACounterContract = function(this: any): void {
  it('allows any address to increment and decrement the counter', async function() {

    let value

    value = (await this.proxy.value()).toString()
    assert.equal(value, 0, 'Incorrect value on this.proxy')

    await this.proxy.increment(1)

    value = (await this.proxy.value()).toString()
    assert.equal(value, 1, 'Incorrect value on this.proxy')

    await this.proxy.decrement(1)

    value = (await this.proxy.value()).toString()
    assert.equal(value, 0, 'Incorrect value on this.proxy')
  })

  it('reports the correct hardcoded version', async function() {
    const version = (await this.proxy.getVersion()).toString()

    assert.equal(version, '0', 'Incorrect counter this.proxy version')
  })
}
