import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Encryptable, FheTypes } from '@cofhe/sdk'
import { createCofheClient, getDeployment } from './utils'

/**
 * Mimics the browser exactly: submit an encrypted credit profile to the already
 * DEPLOYED contract, then wait for the separately-running `npx hardhat oracle`
 * service to fulfill it, and unseal the score. Proves the event-driven oracle
 * path (the thing behind the UI "spinning forever" when no oracle is running).
 *
 *   Terminal 1:  npx hardhat oracle         --network arb-sepolia
 *   Terminal 2:  npx hardhat request-credit --network arb-sepolia
 */
task('request-credit', 'Submit a profile and wait for the running oracle to fulfill it')
  .addOptionalParam('income', 'Plaintext income to encrypt', '60000')
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    const [signer] = await ethers.getSigners()

    const addr = process.env.CREDIT_CONTRACT_ADDRESS || getDeployment(network.name, 'CipherMindCredit')
    if (!addr) throw new Error('No CipherMindCredit address (set CREDIT_CONTRACT_ADDRESS or deploy first).')

    const credit = await ethers.getContractAt('CipherMindCredit', addr, signer)
    const client = await createCofheClient(hre, signer)

    console.log(`\n📨 Submitting encrypted profile (income=${args.income}) to ${addr} as ${signer.address}`)
    const enc = await client
      .encryptInputs([
        Encryptable.uint32(BigInt(Number(args.income))),
        Encryptable.uint32(30n),
        Encryptable.uint32(60n),
        Encryptable.uint32(5n),
      ])
      .execute()
    await (await credit.submitProfile(enc[0], enc[1], enc[2], enc[3])).wait()
    console.log('   ✅ Submitted. Waiting for the oracle service to fulfill...\n')

    let fulfilled = false
    for (let i = 0; i < 30; i++) {
      if ((await credit.results(signer.address)).fulfilled) { fulfilled = true; break }
      await new Promise((r) => setTimeout(r, 4000))
      console.log(`   ⏳ waiting ${(i + 1) * 4}s...`)
    }
    if (!fulfilled) {
      throw new Error('Oracle did not fulfill within 120s — is `npx hardhat oracle` running against this network?')
    }

    const r = await credit.results(signer.address)
    const score = await client.decryptForView(r.score, FheTypes.Uint32).withPermit().execute()
    const conf = await client.decryptForView(r.confidence, FheTypes.Uint32).withPermit().execute()
    console.log(`\n   🔓 Oracle fulfilled! Unsealed score: ${Number(score)} (confidence ${Number(conf)}%)\n`)
  })
