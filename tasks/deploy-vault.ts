import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-vault', 'Deploy MockUSDC + EncryptedVault').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    const [deployer] = await ethers.getSigners()
    console.log(`\n🏦 Deploying vault stack to ${network.name} (deployer ${deployer.address})`)

    const USDC = await ethers.getContractFactory('MockUSDC')
    const usdc = await USDC.deploy()
    await usdc.waitForDeployment()
    const usdcAddr = await usdc.getAddress()
    console.log(`   ✅ MockUSDC:       ${usdcAddr}`)

    const Vault = await ethers.getContractFactory('EncryptedVault')
    const vault = await Vault.deploy(usdcAddr)
    await vault.waitForDeployment()
    const vaultAddr = await vault.getAddress()
    console.log(`   ✅ EncryptedVault: ${vaultAddr}`)

    saveDeployment(network.name, 'MockUSDC', usdcAddr)
    saveDeployment(network.name, 'EncryptedVault', vaultAddr)

    return { usdcAddr, vaultAddr }
  },
)
