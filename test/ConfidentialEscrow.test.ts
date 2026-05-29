/**
 * ConfidentialEscrow — 2-of-2 + arbiter over an encrypted amount.
 * Verified on CoFHE mocks: both-approve release, arbiter refund, amount privacy.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("ConfidentialEscrow", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, buyer, seller, arbiter, outsider] = await hre.ethers.getSigners();
    const Esc = await hre.ethers.getContractFactory("ConfidentialEscrow");
    const esc = await Esc.connect(deployer).deploy();
    const buyerC = await hre.cofhe.createClientWithBatteries(buyer);
    const sellerC = await hre.cofhe.createClientWithBatteries(seller);
    return { esc, buyer, seller, arbiter, outsider, buyerC, sellerC };
  }

  it("releases to the seller when both parties approve", async function () {
    const { esc, buyer, seller, arbiter, buyerC, sellerC } = await loadFixture(fixture);
    const enc = await buyerC.encryptInputs([Encryptable.uint32(500n)]).execute();
    await esc.connect(buyer).openDeal(seller.address, arbiter.address, enc[0], "Design work");

    await esc.connect(buyer).approve(0);
    await esc.connect(seller).approve(0);

    expect((await esc.deals(0)).status).to.equal(1n); // Released
    const bal = await sellerC.decryptForView(await esc.connect(seller).getBalance(), FheTypes.Uint32).withPermit().execute();
    expect(bal).to.equal(500n);
  });

  it("lets the arbiter refund the buyer on dispute", async function () {
    const { esc, buyer, seller, arbiter, buyerC } = await loadFixture(fixture);
    const enc = await buyerC.encryptInputs([Encryptable.uint32(300n)]).execute();
    await esc.connect(buyer).openDeal(seller.address, arbiter.address, enc[0], "disputed");

    await esc.connect(buyer).approve(0); // only buyer approves
    await esc.connect(arbiter).resolve(0, false); // refund buyer

    expect((await esc.deals(0)).status).to.equal(2n); // Refunded
    const bal = await buyerC.decryptForView(await esc.connect(buyer).getBalance(), FheTypes.Uint32).withPermit().execute();
    expect(bal).to.equal(300n);
  });

  it("hides the amount from non-parties and blocks their approval", async function () {
    const { esc, buyer, seller, arbiter, outsider, buyerC } = await loadFixture(fixture);
    const enc = await buyerC.encryptInputs([Encryptable.uint32(123n)]).execute();
    await esc.connect(buyer).openDeal(seller.address, arbiter.address, enc[0], "x");

    await expect(esc.connect(outsider).getAmount(0)).to.be.revertedWithCustomError(esc, "NotParty");
    await expect(esc.connect(outsider).approve(0)).to.be.revertedWithCustomError(esc, "NotParty");
  });
});
