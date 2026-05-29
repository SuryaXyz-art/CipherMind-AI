import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment, getDeployment } from './utils'

task('deploy-payroll-lending', 'Deploy ConfidentialPayroll + ConfidentialLending').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre

    const usdcAddr = process.env.USDC_CONTRACT_ADDRESS || getDeployment(network.name, 'MockUSDC')
    if (!usdcAddr) throw new Error('No MockUSDC address — run deploy-vault first or set USDC_CONTRACT_ADDRESS.')

    console.log(`\n🏗️  Deploying Payroll + Lending to ${network.name} (USDC ${usdcAddr})`)

    const Payroll = await ethers.getContractFactory('ConfidentialPayroll')
    const payroll = await Payroll.deploy()
    await payroll.waitForDeployment()
    const payrollAddr = await payroll.getAddress()
    console.log(`   ✅ ConfidentialPayroll: ${payrollAddr}`)

    const Lending = await ethers.getContractFactory('ConfidentialLending')
    const lending = await Lending.deploy(usdcAddr)
    await lending.waitForDeployment()
    const lendingAddr = await lending.getAddress()
    console.log(`   ✅ ConfidentialLending: ${lendingAddr}`)

    saveDeployment(network.name, 'ConfidentialPayroll', payrollAddr)
    saveDeployment(network.name, 'ConfidentialLending', lendingAddr)

    return { payrollAddr, lendingAddr }
  },
)
