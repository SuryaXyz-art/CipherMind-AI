import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-surfaces', 'Deploy PaymentRequests + Crowdfund + ConfidentialEscrow').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    console.log(`\n🧩 Deploying extra surfaces to ${network.name}`)

    const Reqs = await ethers.getContractFactory('PaymentRequests')
    const reqs = await Reqs.deploy()
    await reqs.waitForDeployment()
    const reqsAddr = await reqs.getAddress()
    console.log(`   ✅ PaymentRequests: ${reqsAddr}`)

    const CF = await ethers.getContractFactory('Crowdfund')
    const cf = await CF.deploy()
    await cf.waitForDeployment()
    const cfAddr = await cf.getAddress()
    console.log(`   ✅ Crowdfund:       ${cfAddr}`)

    const Esc = await ethers.getContractFactory('ConfidentialEscrow')
    const esc = await Esc.deploy()
    await esc.waitForDeployment()
    const escAddr = await esc.getAddress()
    console.log(`   ✅ ConfidentialEscrow: ${escAddr}`)

    saveDeployment(network.name, 'PaymentRequests', reqsAddr)
    saveDeployment(network.name, 'Crowdfund', cfAddr)
    saveDeployment(network.name, 'ConfidentialEscrow', escAddr)
    return { reqsAddr, cfAddr, escAddr }
  },
)
