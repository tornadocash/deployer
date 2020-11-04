/* global artifacts, web3, contract */
require('chai').use(require('bn-chai')(web3.utils.BN)).use(require('chai-as-promised')).should()

const { takeSnapshot, revertSnapshot } = require('../scripts/ganacheHelper')
const Deployer = artifacts.require('Deployer.sol')
const SingletonFactory = artifacts.require('SingletonFactory.sol')
const { keccak256, hexToBytes } = require('web3-utils')

function getExpectedAddress(address, bytecode, salt) {
  const arg = hexToBytes('0xff')
    .concat(hexToBytes(address))
    .concat(hexToBytes(salt))
    .concat(hexToBytes(keccak256(bytecode)))
  return '0x' + keccak256(arg).slice(26)
}

contract('Deployer', (accounts) => {
  let factory
  let deployer
  let snapshotId

  before(async () => {
    factory = await SingletonFactory.new()
    deployer = await Deployer.new(factory.address)
    snapshotId = await takeSnapshot()
  })

  describe('#deployer', () => {
    it('should work', async () => {
      const bytecode = SingletonFactory.bytecode
      const salt = '0x000000000000000000000000000000000000000000000000000000000000beef'
      const expectedAddress = getExpectedAddress(factory.address, bytecode, salt)
      const { logs } = await deployer.deploy(bytecode, salt)

      logs[0].event.should.be.equal('Deployed')
      logs[0].args.sender.should.be.equal(accounts[0])
      logs[0].args.addr.toLowerCase().should.be.equal(expectedAddress)
    })

    it('should throw on repeated deploy', async () => {
      const bytecode = SingletonFactory.bytecode
      const salt = '0x000000000000000000000000000000000000000000000000000000000000beef'
      await deployer.deploy(bytecode, salt)
      await deployer.deploy(bytecode, salt).should.be.rejectedWith('Deploy failed')
    })

    it('should throw on failed deploy')
  })

  afterEach(async () => {
    await revertSnapshot(snapshotId.result)
    // eslint-disable-next-line require-atomic-updates
    snapshotId = await takeSnapshot()
  })
})
