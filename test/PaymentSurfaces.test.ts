/**
 * PaymentRequests + Crowdfund — two more confidential surfaces.
 * Verified on CoFHE mocks: public memo/participation, encrypted amounts.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("PaymentRequests", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, alice, bob] = await hre.ethers.getSigners();
    const Reqs = await hre.ethers.getContractFactory("PaymentRequests");
    const reqs = await Reqs.connect(deployer).deploy();
    const aliceClient = await hre.cofhe.createClientWithBatteries(alice);
    const bobClient = await hre.cofhe.createClientWithBatteries(bob);
    return { reqs, alice, bob, aliceClient, bobClient };
  }

  it("lets a payer fulfill a request; only the requester unseals the amount", async function () {
    const { reqs, alice, bob, aliceClient } = await loadFixture(fixture);

    const enc = await aliceClient.encryptInputs([Encryptable.uint32(250n)]).execute();
    await reqs.connect(alice).createRequest(enc[0], "April rent share");
    await reqs.connect(bob).pay(0);

    const r = await reqs.requests(0);
    expect(r.fulfilled).to.equal(true);
    expect(r.payer).to.equal(bob.address);

    const received = await aliceClient
      .decryptForView(await reqs.connect(alice).getReceived(), FheTypes.Uint32)
      .withPermit()
      .execute();
    expect(received).to.equal(250n);
  });

  it("blocks paying a cancelled request", async function () {
    const { reqs, alice, bob, aliceClient } = await loadFixture(fixture);
    const enc = await aliceClient.encryptInputs([Encryptable.uint32(100n)]).execute();
    await reqs.connect(alice).createRequest(enc[0], "memo");
    await reqs.connect(alice).cancel(0);
    await expect(reqs.connect(bob).pay(0)).to.be.revertedWithCustomError(reqs, "NotOpen");
  });

  it("hides the requested amount from non-requesters", async function () {
    const { reqs, alice, bob } = await loadFixture(fixture);
    const enc = await (await hre.cofhe.createClientWithBatteries(alice)).encryptInputs([Encryptable.uint32(99n)]).execute();
    await reqs.connect(alice).createRequest(enc[0], "memo");
    await expect(reqs.connect(bob).getRequestedAmount(0)).to.be.revertedWithCustomError(reqs, "NotRequester");
  });
});

describe("Crowdfund", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, owner, a, b] = await hre.ethers.getSigners();
    const CF = await hre.ethers.getContractFactory("Crowdfund");
    const cf = await CF.connect(deployer).deploy();
    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const aClient = await hre.cofhe.createClientWithBatteries(a);
    const bClient = await hre.cofhe.createClientWithBatteries(b);
    return { cf, owner, a, b, ownerClient, aClient, bClient };
  }

  it("aggregates encrypted contributions and reports goal reached", async function () {
    const { cf, owner, a, b, ownerClient, aClient } = await loadFixture(fixture);

    const goal = await ownerClient.encryptInputs([Encryptable.uint32(1000n)]).execute();
    await cf.connect(owner).createCampaign(goal[0], "Community project");

    const ca = await aClient.encryptInputs([Encryptable.uint32(700n)]).execute();
    await cf.connect(a).contribute(0, ca[0]);
    const cb = await (await hre.cofhe.createClientWithBatteries(b)).encryptInputs([Encryptable.uint32(400n)]).execute();
    await cf.connect(b).contribute(0, cb[0]);

    expect((await cf.campaigns(0)).contributorCount).to.equal(2n);

    // Owner sees the encrypted total (700 + 400 = 1100) and goal-reached.
    const raised = await ownerClient.decryptForView(await cf.connect(owner).getRaised(0), FheTypes.Uint32).withPermit().execute();
    expect(raised).to.equal(1100n);

    await cf.connect(owner).checkGoalReached(0);
    const reached = await ownerClient.decryptForView(await cf.connect(owner).getGoalReached(0), FheTypes.Bool).withPermit().execute();
    expect(reached).to.equal(true); // 1100 >= 1000

    // Contributor sees only their own amount.
    const mine = await aClient.decryptForView(await cf.connect(a).getMyContribution(0), FheTypes.Uint32).withPermit().execute();
    expect(mine).to.equal(700n);
  });

  it("hides the raised total from non-owners", async function () {
    const { cf, owner, a } = await loadFixture(fixture);
    const goal = await (await hre.cofhe.createClientWithBatteries(owner)).encryptInputs([Encryptable.uint32(500n)]).execute();
    await cf.connect(owner).createCampaign(goal[0], "x");
    await expect(cf.connect(a).getRaised(0)).to.be.revertedWithCustomError(cf, "NotOwner");
  });
});
