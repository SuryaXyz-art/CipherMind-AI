import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDeployment } from './utils'

/**
 * Verify all deployed CipherMind contracts on the block explorer in one shot.
 *
 *   1. Set ARBISCAN_API_KEY in .env (get one free at https://arbiscan.io/myapikey)
 *   2. npx hardhat verify-all --network arb-sepolia
 *
 * Addresses are read from env first, then deployments/<network>.json.
 * Already-verified contracts are skipped gracefully.
 */
task('verify-all', 'Verify all deployed CipherMind contracts on the explorer').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { network, ethers } = hre
    const [deployer] = await ethers.getSigners()
    const oracle = process.env.ORACLE_ADDRESS || deployer.address

    const dep = (name: string, envKey?: string) =>
      (envKey && process.env[envKey]) || getDeployment(network.name, name) || ''

    const usdc = dep('MockUSDC', 'USDC_CONTRACT_ADDRESS')

    const targets: { name: string; address: string; args: any[] }[] = [
      { name: 'MockUSDC', address: usdc, args: [] },
      { name: 'EncryptedVault', address: dep('EncryptedVault', 'VAULT_CONTRACT_ADDRESS'), args: [usdc] },
      { name: 'ConfidentialPayroll', address: dep('ConfidentialPayroll', 'PAYROLL_CONTRACT_ADDRESS'), args: [] },
      { name: 'ConfidentialLending', address: dep('ConfidentialLending', 'LENDING_CONTRACT_ADDRESS'), args: [usdc] },
      { name: 'CipherMindCredit', address: dep('CipherMindCredit', 'CREDIT_CONTRACT_ADDRESS'), args: [oracle] },
      { name: 'CipherMindTrading', address: dep('CipherMindTrading', 'TRADING_CONTRACT_ADDRESS'), args: [oracle] },
    ]

    for (const t of targets) {
      if (!t.address) {
        console.log(`⏭️  ${t.name}: no address found — skipping`)
        continue
      }
      console.log(`\n🔍 Verifying ${t.name} @ ${t.address} ...`)
      try {
        await hre.run('verify:verify', { address: t.address, constructorArguments: t.args })
        console.log(`   ✅ ${t.name} verified`)
      } catch (err: any) {
        const msg = String(err?.message || err)
        if (/already verified/i.test(msg)) console.log(`   ✓ ${t.name} already verified`)
        else console.error(`   ❌ ${t.name}: ${msg.split('\n')[0]}`)
      }
    }
    console.log('\nDone.')
  },
)
