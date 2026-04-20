import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-analytics', 'Deploy the CipherMindAnalytics contract').setAction(
	async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		console.log(`\n🧠 Deploying CipherMindAnalytics to ${network.name}...`)

		const [deployer] = await ethers.getSigners()
		console.log(`   Deployer: ${deployer.address}`)

		const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address
		console.log(`   Oracle:   ${oracleAddress}`)

		const CipherMindAnalytics = await ethers.getContractFactory('CipherMindAnalytics')
		const analytics = await CipherMindAnalytics.deploy(oracleAddress)
		await analytics.waitForDeployment()

		const analyticsAddress = await analytics.getAddress()
		console.log(`\n   ✅ CipherMindAnalytics deployed to: ${analyticsAddress}`)

		saveDeployment(network.name, 'CipherMindAnalytics', analyticsAddress)

		return analyticsAddress
	},
)
