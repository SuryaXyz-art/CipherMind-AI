import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { createCofheClient, getDeployment } from './utils'
import { fulfillCreditRequest, fulfillTradingRequest } from '../backend/oracleLogic'

/**
 * The CipherMind off-chain oracle.
 *
 * Listens for CreditRequested / SignalRequested events, then runs the real
 * CoFHE loop (decrypt → anonymize → Nous Hermes → encrypt → fulfill) from
 * backend/oracleLogic.ts. Works on localcofhe mocks and on Arbitrum Sepolia.
 *
 *   npx hardhat oracle --network localcofhe
 *   npx hardhat oracle --network arb-sepolia
 *
 * Contract addresses are read from env (CREDIT_CONTRACT_ADDRESS /
 * TRADING_CONTRACT_ADDRESS) or fall back to deployments/<network>.json.
 */
task('oracle', 'Run the CipherMind off-chain Nous Hermes oracle').setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre

    const [signer] = await ethers.getSigners()
    const client = await createCofheClient(hre, signer)

    const creditAddr =
      process.env.CREDIT_CONTRACT_ADDRESS || getDeployment(network.name, 'CipherMindCredit')
    const tradingAddr =
      process.env.TRADING_CONTRACT_ADDRESS || getDeployment(network.name, 'CipherMindTrading')

    console.log('\n╔══════════════════════════════════════════════╗')
    console.log('║       🧠 CipherMind AI Oracle Service        ║')
    console.log('╠══════════════════════════════════════════════╣')
    console.log(`║  Network:  ${network.name}`)
    console.log(`║  Oracle:   ${signer.address}`)
    console.log(`║  Credit:   ${creditAddr ?? '— (not set)'}`)
    console.log(`║  Trading:  ${tradingAddr ?? '— (not set)'}`)
    console.log('╚══════════════════════════════════════════════╝\n')

    if (creditAddr) {
      const credit = await ethers.getContractAt('CipherMindCredit', creditAddr, signer)
      credit.on(credit.getEvent('CreditRequested'), async (user: string, requestId: bigint) => {
        console.log(`\n🔐 CreditRequested #${requestId} from ${user}`)
        try {
          const { result } = await fulfillCreditRequest(client, credit, user)
          console.log(`   ✅ Score ${result.score} (confidence ${result.confidence}%) written on-chain`)
        } catch (err) {
          console.error('   ❌ Credit fulfillment failed:', err)
        }
      })
      console.log(`   📋 Listening for CreditRequested on ${creditAddr}`)
    }

    if (tradingAddr) {
      const trading = await ethers.getContractAt('CipherMindTrading', tradingAddr, signer)
      trading.on(
        trading.getEvent('SignalRequested'),
        async (user: string, asset: string, requestId: bigint) => {
          console.log(`\n📊 SignalRequested #${requestId} from ${user} (${asset})`)
          try {
            const { result } = await fulfillTradingRequest(client, trading, user, asset)
            const dir = ['HOLD', 'BUY', 'SELL'][result.direction]
            console.log(`   ✅ Signal ${dir} (strength ${result.strength}%) written on-chain`)
          } catch (err) {
            console.error('   ❌ Trading fulfillment failed:', err)
          }
        },
      )
      console.log(`   📊 Listening for SignalRequested on ${tradingAddr}`)
    }

    if (!creditAddr && !tradingAddr) {
      console.log('⚠️  No contract addresses configured — nothing to listen to. Deploy first.')
      return
    }

    console.log('\n✅ Oracle running. Press Ctrl+C to stop.\n')
    await new Promise(() => {}) // keep alive
  },
)
