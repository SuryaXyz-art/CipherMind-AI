import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-governance', 'Deploy EncryptedGovernance').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    const Gov = await ethers.getContractFactory('EncryptedGovernance')
    const gov = await Gov.deploy()
    await gov.waitForDeployment()
    const addr = await gov.getAddress()
    console.log(`\n🗳️  EncryptedGovernance deployed to ${network.name}: ${addr}`)
    saveDeployment(network.name, 'EncryptedGovernance', addr)
    return addr
  },
)
