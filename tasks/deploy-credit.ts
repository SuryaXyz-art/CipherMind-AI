import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

task('deploy-credit', 'Deploy the CipherMindCredit contract').setAction(
	async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		console.log(`\n🔐 Deploying CipherMindCredit to ${network.name}...`)

		const [deployer] = await ethers.getSigners()
		console.log(`   Deployer: ${deployer.address}`)

		// Use the deployer as the oracle for now (can be updated later)
		const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address
		console.log(`   Oracle:   ${oracleAddress}`)

		const CipherMindCredit = await ethers.getContractFactory('CipherMindCredit')
		const credit = await CipherMindCredit.deploy(oracleAddress)
		await credit.waitForDeployment()

		const creditAddress = await credit.getAddress()
		console.log(`\n   ✅ CipherMindCredit deployed to: ${creditAddress}`)

		saveDeployment(network.name, 'CipherMindCredit', creditAddress)

		return creditAddress
	},
)
