const { getEventArgument } = require('@aragon/test-helpers/events')

module.exports = (artifacts) => {
  const deployDao = async (owner) => {
    const ACL = artifacts.require('ACL')
    const Kernel = artifacts.require('Kernel')
    const EVMScriptRegistryFactory = artifacts.require('EVMScriptRegistryFactory')
    const DAOFactory = artifacts.require('DAOFactory')

    const kernelBase = await Kernel.new(true) // petrify immediately
    const aclBase = await ACL.new()
    const regFact = await EVMScriptRegistryFactory.new()
    const daoFact = await DAOFactory.new(kernelBase.address, aclBase.address, regFact.address)
    const r = await daoFact.newDAO(owner)
    const dao = Kernel.at(getEventArgument(r, 'DeployDAO', 'dao'))
    const acl = ACL.at(await dao.acl())

    await acl.createPermission(owner, dao.address, await dao.APP_MANAGER_ROLE(), owner, { from: owner })

    return { dao, acl }
  }

  return {
    deployDao
  }
}
