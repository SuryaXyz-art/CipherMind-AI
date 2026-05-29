import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Encryptable, FheTypes } from '@cofhe/sdk'
import { createCofheClient } from './utils'
import { fulfillCreditRequest } from '../backend/oracleLogic'

/**
 * Full-stack smoke test: deploy CipherMindCredit, submit an encrypted profile,
 * run the real oracle loop (decrypt → anonymize → Nous Hermes → encrypt →
 * fulfill), then unseal the score. A single funded key plays deployer + oracle
 * + user, so it works with just PRIVATE_KEY.
 *
 *   npx hardhat e2e                       # in-process CoFHE mocks + live Nous
 *   npx hardhat e2e --network arb-sepolia # real testnet smoke test
 */
task('e2e', 'Deploy + run one full encrypted credit request end-to-end')
  .addOptionalParam('income', 'Plaintext annual income to encrypt', '82000')
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { ethers, network } = hre
    const [signer] = await ethers.getSigners()

    if (network.name === 'hardhat') {
      await hre.run('task:cofhe-mocks:deploy')
    }

    console.log(`\n🧠 CipherMind e2e on ${network.name} as ${signer.address}\n`)

    const Credit = await ethers.getContractFactory('CipherMindCredit')
    const credit = await Credit.connect(signer).deploy(signer.address) // oracle = signer
    await credit.waitForDeployment()
    console.log(`   ✅ CipherMindCredit deployed: ${await credit.getAddress()}`)

    const client = await createCofheClient(hre, signer)

    // 1. User encrypts + submits a profile.
    const income = Number(args.income)
    console.log(`   🔒 Encrypting profile (income=${income}, debt=30%, history=60m, accts=5)...`)
    const enc = await client
      .encryptInputs([
        Encryptable.uint32(BigInt(income)),
        Encryptable.uint32(30n),
        Encryptable.uint32(60n),
        Encryptable.uint32(5n),
      ])
      .execute()
    await (await credit.submitProfile(enc[0], enc[1], enc[2], enc[3])).wait()
    console.log('   📨 Encrypted profile submitted on-chain.')

    // 2. Oracle decrypts → anonymizes → Nous Hermes → encrypts → fulfills.
    console.log('   🤖 Oracle processing via Nous Hermes...')
    const { raw, result } = await fulfillCreditRequest(client, credit, signer.address)
    console.log(`      oracle decrypted bands from raw: ${JSON.stringify(raw)}`)
    console.log(`      Hermes => score ${result.score}, confidence ${result.confidence}%`)
    console.log(`      reasoning: ${result.reasoning}`)

    // 3. User unseals the encrypted result.
    const r = await credit.results(signer.address)
    const score = await client.decryptForView(r.score, FheTypes.Uint32).withPermit().execute()
    const conf = await client.decryptForView(r.confidence, FheTypes.Uint32).withPermit().execute()
    console.log(`\n   🔓 Unsealed on-chain score: ${Number(score)} (confidence ${Number(conf)}%)`)
    console.log('\n✅ End-to-end flow complete.\n')
  })
