/**
 * EncryptedVault — the foundation of the private-payments surfaces.
 * Verified on the CoFHE mocks: deposit (public USDC -> encrypted balance),
 * private send (encrypted amount, overdraft moves 0), balance proof, and
 * selective disclosure.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("EncryptedVault", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, alice, bob] = await hre.ethers.getSigners();

    const USDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.connect(deployer).deploy();

    const Vault = await hre.ethers.getContractFactory("EncryptedVault");
    const vault = await Vault.connect(deployer).deploy(await usdc.getAddress());
    const vaultAddr = await vault.getAddress();

    const aliceClient = await hre.cofhe.createClientWithBatteries(alice);
    const bobClient = await hre.cofhe.createClientWithBatteries(bob);

    // Fund + approve + deposit helper.
    async function fund(signer: any, amount: bigint) {
      await usdc.connect(signer).faucet(amount);
      await usdc.connect(signer).approve(vaultAddr, amount);
      await vault.connect(signer).deposit(amount);
    }

    return { usdc, vault, alice, bob, aliceClient, bobClient, fund };
  }

  it("deposits public USDC into an encrypted balance the owner can unseal", async function () {
    const { vault, alice, aliceClient, fund } = await loadFixture(fixture);
    await fund(alice, 100n);

    const handle = await vault.connect(alice).getEncryptedBalance();
    const bal = await aliceClient.decryptForView(handle, FheTypes.Uint32).withPermit().execute();
    expect(bal).to.equal(100n);
  });

  it("sends an encrypted amount between accounts", async function () {
    const { vault, alice, bob, aliceClient, bobClient, fund } = await loadFixture(fixture);
    await fund(alice, 100n);
    await fund(bob, 0n === 0n ? 1n : 1n); // give bob an account (deposit 1)

    const enc = await aliceClient.encryptInputs([Encryptable.uint32(30n)]).execute();
    await vault.connect(alice).send(bob.address, enc[0]);

    const aliceBal = await aliceClient
      .decryptForView(await vault.connect(alice).getEncryptedBalance(), FheTypes.Uint32)
      .withPermit()
      .execute();
    const bobBal = await bobClient
      .decryptForView(await vault.connect(bob).getEncryptedBalance(), FheTypes.Uint32)
      .withPermit()
      .execute();

    expect(aliceBal).to.equal(70n); // 100 - 30
    expect(bobBal).to.equal(31n); // 1 + 30
  });

  it("moves 0 on overdraft instead of reverting or leaking", async function () {
    const { vault, alice, bob, aliceClient, bobClient, fund } = await loadFixture(fixture);
    await fund(alice, 50n);
    await fund(bob, 5n);

    const enc = await aliceClient.encryptInputs([Encryptable.uint32(999n)]).execute();
    await vault.connect(alice).send(bob.address, enc[0]); // insufficient -> moves 0

    const aliceBal = await aliceClient
      .decryptForView(await vault.connect(alice).getEncryptedBalance(), FheTypes.Uint32)
      .withPermit()
      .execute();
    const bobBal = await bobClient
      .decryptForView(await vault.connect(bob).getEncryptedBalance(), FheTypes.Uint32)
      .withPermit()
      .execute();

    expect(aliceBal).to.equal(50n);
    expect(bobBal).to.equal(5n);
  });

  it("proves balance >= threshold as an encrypted boolean", async function () {
    const { vault, alice, aliceClient, fund } = await loadFixture(fixture);
    await fund(alice, 73n);

    let t = await aliceClient.encryptInputs([Encryptable.uint32(50n)]).execute();
    await vault.connect(alice).proveBalanceAtLeast(t[0]);
    let h = await vault.connect(alice).getBalanceProof();
    expect(await aliceClient.decryptForView(h, FheTypes.Bool).withPermit().execute()).to.equal(true);

    t = await aliceClient.encryptInputs([Encryptable.uint32(100n)]).execute();
    await vault.connect(alice).proveBalanceAtLeast(t[0]);
    h = await vault.connect(alice).getBalanceProof();
    expect(await aliceClient.decryptForView(h, FheTypes.Bool).withPermit().execute()).to.equal(false);
  });

  it("grants a viewer access to unseal the balance", async function () {
    const { vault, alice, bob, aliceClient, bobClient, fund } = await loadFixture(fixture);
    await fund(alice, 42n);
    const handle = await vault.connect(alice).getEncryptedBalance();

    let blocked = false;
    try {
      await bobClient.decryptForView(handle, FheTypes.Uint32).withPermit().execute();
    } catch {
      blocked = true;
    }
    expect(blocked).to.equal(true);

    await vault.connect(alice).grantBalanceAccess(bob.address);
    expect(await bobClient.decryptForView(handle, FheTypes.Uint32).withPermit().execute()).to.equal(42n);
  });
});
