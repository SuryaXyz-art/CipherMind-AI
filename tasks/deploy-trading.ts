import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-trading', 'Deploy the CipherMindTrading contract').setAction(
	async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		console.log(`\n📊 Deploying CipherMindTrading to ${network.name}...`)

		const [deployer] = await ethers.getSigners()
		console.log(`   Deployer: ${deployer.address}`)

		const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address
		console.log(`   Oracle:   ${oracleAddress}`)

		const CipherMindTrading = await ethers.getContractFactory('CipherMindTrading')
		const trading = await CipherMindTrading.deploy(oracleAddress)
		await trading.waitForDeployment()

		const tradingAddress = await trading.getAddress()
		console.log(`\n   ✅ CipherMindTrading deployed to: ${tradingAddress}`)

		saveDeployment(network.name, 'CipherMindTrading', tradingAddress)

		return tradingAddress
	},
)
