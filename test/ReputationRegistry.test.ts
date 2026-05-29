/**
 * ReputationRegistry — private reputation from encrypted attestations.
 * Verified on CoFHE mocks: accrual, threshold proof, self-attest block, disclosure.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("ReputationRegistry", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, subject, att1, att2, viewer] = await hre.ethers.getSigners();
    const Rep = await hre.ethers.getContractFactory("ReputationRegistry");
    const rep = await Rep.connect(deployer).deploy();
    const subjectC = await hre.cofhe.createClientWithBatteries(subject);
    const att1C = await hre.cofhe.createClientWithBatteries(att1);
    const att2C = await hre.cofhe.createClientWithBatteries(att2);
    const viewerC = await hre.cofhe.createClientWithBatteries(viewer);
    return { rep, subject, att1, att2, viewer, subjectC, att1C, att2C, viewerC };
  }

  it("accrues encrypted reputation from attestations the subject can unseal", async function () {
    const { rep, subject, att1, att2, subjectC, att1C, att2C } = await loadFixture(fixture);

    const p1 = await att1C.encryptInputs([Encryptable.uint32(40n)]).execute();
    const p2 = await att2C.encryptInputs([Encryptable.uint32(30n)]).execute();
    await rep.connect(att1).attest(subject.address, p1[0]);
    await rep.connect(att2).attest(subject.address, p2[0]);

    expect(await rep.attestationCount(subject.address)).to.equal(2n);
    const score = await subjectC.decryptForView(await rep.connect(subject).getReputation(), FheTypes.Uint32).withPermit().execute();
    expect(score).to.equal(70n);
  });

  it("proves reputation >= threshold as an encrypted boolean", async function () {
    const { rep, subject, att1, subjectC, att1C } = await loadFixture(fixture);
    const p = await att1C.encryptInputs([Encryptable.uint32(65n)]).execute();
    await rep.connect(att1).attest(subject.address, p[0]);

    let t = await subjectC.encryptInputs([Encryptable.uint32(50n)]).execute();
    await rep.connect(subject).proveAtLeast(t[0]);
    expect(await subjectC.decryptForView(await rep.connect(subject).getProof(), FheTypes.Bool).withPermit().execute()).to.equal(true);

    t = await subjectC.encryptInputs([Encryptable.uint32(100n)]).execute();
    await rep.connect(subject).proveAtLeast(t[0]);
    expect(await subjectC.decryptForView(await rep.connect(subject).getProof(), FheTypes.Bool).withPermit().execute()).to.equal(false);
  });

  it("blocks self-attestation and supports selective disclosure", async function () {
    const { rep, subject, att1, viewer, subjectC, att1C, viewerC } = await loadFixture(fixture);
    const self = await subjectC.encryptInputs([Encryptable.uint32(999n)]).execute();
    await expect(rep.connect(subject).attest(subject.address, self[0])).to.be.revertedWithCustomError(rep, "SelfAttest");

    const p = await att1C.encryptInputs([Encryptable.uint32(55n)]).execute();
    await rep.connect(att1).attest(subject.address, p[0]);

    const handle = await rep.connect(subject).getReputation();
    await rep.connect(subject).grantAccess(viewer.address);
    expect(await viewerC.decryptForView(handle, FheTypes.Uint32).withPermit().execute()).to.equal(55n);
  });
});
