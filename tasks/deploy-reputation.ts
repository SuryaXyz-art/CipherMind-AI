import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-reputation', 'Deploy ReputationRegistry').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    const Rep = await ethers.getContractFactory('ReputationRegistry')
    const rep = await Rep.deploy()
    await rep.waitForDeployment()
    const addr = await rep.getAddress()
    console.log(`\n🏅 ReputationRegistry deployed to ${network.name}: ${addr}`)
    saveDeployment(network.name, 'ReputationRegistry', addr)
    return addr
  },
)
