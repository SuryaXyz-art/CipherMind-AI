/**
 * EncryptedGovernance — confidential DAO voting. Only encrypted tallies are
 * stored (never individual votes); the aggregate is revealed at finalize.
 * Verified on CoFHE mocks.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("EncryptedGovernance", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, proposer, v1, v2, v3] = await hre.ethers.getSigners();
    const Gov = await hre.ethers.getContractFactory("EncryptedGovernance");
    const gov = await Gov.connect(deployer).deploy();
    const clients = {
      proposer: await hre.cofhe.createClientWithBatteries(proposer),
      v1: await hre.cofhe.createClientWithBatteries(v1),
      v2: await hre.cofhe.createClientWithBatteries(v2),
      v3: await hre.cofhe.createClientWithBatteries(v3),
    };
    return { gov, proposer, v1, v2, v3, clients };
  }

  it("tallies encrypted votes and reveals only the aggregate", async function () {
    const { gov, proposer, v1, v2, v3, clients } = await loadFixture(fixture);

    await gov.connect(proposer).createProposal("Increase treasury yield allocation");
    const id = 0;

    // v1 yes (1), v2 yes (1), v3 no (0)
    const yes1 = await clients.v1.encryptInputs([Encryptable.uint32(1n)]).execute();
    const yes2 = await clients.v2.encryptInputs([Encryptable.uint32(1n)]).execute();
    const no3 = await clients.v3.encryptInputs([Encryptable.uint32(0n)]).execute();
    await gov.connect(v1).vote(id, yes1[0]);
    await gov.connect(v2).vote(id, yes2[0]);
    await gov.connect(v3).vote(id, no3[0]);

    expect((await gov.proposals(id)).voters).to.equal(3n);

    await gov.connect(proposer).finalize(id);

    // Aggregate is public; anyone can unseal the totals (not individual votes).
    const yesHash = await gov.getYes(id);
    const noHash = await gov.getNo(id);
    const yes = await clients.proposer.decryptForTx(yesHash).withoutPermit().execute();
    const no = await clients.proposer.decryptForTx(noHash).withoutPermit().execute();

    expect(yes.decryptedValue).to.equal(2n);
    expect(no.decryptedValue).to.equal(1n);
  });

  it("blocks double voting and votes after finalize", async function () {
    const { gov, proposer, v1, clients } = await loadFixture(fixture);
    await gov.connect(proposer).createProposal("x");
    const c = await clients.v1.encryptInputs([Encryptable.uint32(1n)]).execute();
    await gov.connect(v1).vote(0, c[0]);
    const c2 = await clients.v1.encryptInputs([Encryptable.uint32(1n)]).execute();
    await expect(gov.connect(v1).vote(0, c2[0])).to.be.revertedWithCustomError(gov, "AlreadyVoted");

    await gov.connect(proposer).finalize(0);
    const c3 = await clients.v1.encryptInputs([Encryptable.uint32(0n)]).execute();
    await expect(gov.connect(proposer).vote(0, c3[0])).to.be.revertedWithCustomError(gov, "AlreadyFinalized");
  });
});
