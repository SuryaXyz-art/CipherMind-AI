/**
 * ConfidentialLending — borrow against collateral with everything encrypted.
 * Verified on CoFHE mocks: collateral deposit, borrow within 75% LTV, silent
 * clamp-to-0 on over-borrow, repay, and the encrypted health check.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("ConfidentialLending", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, alice] = await hre.ethers.getSigners();

    const USDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.connect(deployer).deploy();

    const Lending = await hre.ethers.getContractFactory("ConfidentialLending");
    const lending = await Lending.connect(deployer).deploy(await usdc.getAddress());
    const lendingAddr = await lending.getAddress();

    const aliceClient = await hre.cofhe.createClientWithBatteries(alice);

    // fund + approve + deposit collateral
    await usdc.connect(alice).faucet(1000n);
    await usdc.connect(alice).approve(lendingAddr, 1000n);
    await lending.connect(alice).depositCollateral(1000n);

    return { lending, alice, aliceClient };
  }

  async function unseal(client: any, handle: any) {
    return client.decryptForView(handle, FheTypes.Uint32).withPermit().execute();
  }

  it("borrows within the 75% LTV and tracks encrypted debt", async function () {
    const { lending, alice, aliceClient } = await loadFixture(fixture);

    const enc = await aliceClient.encryptInputs([Encryptable.uint32(700n)]).execute(); // <= 750
    await lending.connect(alice).borrow(enc[0]);

    const debt = await unseal(aliceClient, await lending.connect(alice).getEncryptedDebt());
    const drawn = await unseal(aliceClient, await lending.connect(alice).getEncryptedBorrowable());
    expect(debt).to.equal(700n);
    expect(drawn).to.equal(700n);
  });

  it("silently grants 0 when a borrow would exceed LTV", async function () {
    const { lending, alice, aliceClient } = await loadFixture(fixture);

    // First borrow 700 (ok), then try 100 more -> 800 > 750 -> clamps to 0.
    let enc = await aliceClient.encryptInputs([Encryptable.uint32(700n)]).execute();
    await lending.connect(alice).borrow(enc[0]);
    enc = await aliceClient.encryptInputs([Encryptable.uint32(100n)]).execute();
    await lending.connect(alice).borrow(enc[0]);

    const debt = await unseal(aliceClient, await lending.connect(alice).getEncryptedDebt());
    expect(debt).to.equal(700n); // unchanged
  });

  it("repays toward debt (capped at outstanding)", async function () {
    const { lending, alice, aliceClient } = await loadFixture(fixture);

    let enc = await aliceClient.encryptInputs([Encryptable.uint32(600n)]).execute();
    await lending.connect(alice).borrow(enc[0]);

    enc = await aliceClient.encryptInputs([Encryptable.uint32(250n)]).execute();
    await lending.connect(alice).repay(enc[0]);

    const debt = await unseal(aliceClient, await lending.connect(alice).getEncryptedDebt());
    expect(debt).to.equal(350n); // 600 - 250
  });

  it("reports an encrypted health check", async function () {
    const { lending, alice, aliceClient } = await loadFixture(fixture);

    const enc = await aliceClient.encryptInputs([Encryptable.uint32(700n)]).execute();
    await lending.connect(alice).borrow(enc[0]);

    await lending.connect(alice).checkHealth();
    const h = await lending.connect(alice).getHealth();
    const healthy = await aliceClient.decryptForView(h, FheTypes.Bool).withPermit().execute();
    expect(healthy).to.equal(true); // debt 700 <= 750
  });
});
