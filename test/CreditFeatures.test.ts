/**
 * Tests for the three confidential-credit features on CipherMindCredit:
 *   1. Confidential benchmarking  — "am I above the network average?" (encrypted)
 *   2. Encrypted threshold alerts  — "is my score ≥ X?" (encrypted, X private)
 *   3. Selective-disclosure passport — grant ONE viewer decrypt rights
 *
 * Everything is verified on the CoFHE mocks: each feature's answer is an
 * encrypted handle that is unsealed off-chain via the holder's permit.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("CipherMind confidential features", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, oracle, user1, user2] = await hre.ethers.getSigners();

    const Credit = await hre.ethers.getContractFactory("CipherMindCredit");
    const credit = await Credit.connect(deployer).deploy(oracle.address);

    const oracleClient = await hre.cofhe.createClientWithBatteries(oracle);
    const user1Client = await hre.cofhe.createClientWithBatteries(user1);
    const user2Client = await hre.cofhe.createClientWithBatteries(user2);

    // Helper: submit a (dummy) profile then have the oracle fulfill an exact score.
    async function setScore(user: any, userClient: any, score: bigint) {
      const p = await userClient
        .encryptInputs([
          Encryptable.uint32(50000n),
          Encryptable.uint32(30n),
          Encryptable.uint32(36n),
          Encryptable.uint32(4n),
        ])
        .execute();
      await credit.connect(user).submitProfile(p[0], p[1], p[2], p[3]);

      const s = await oracleClient
        .encryptInputs([Encryptable.uint32(score), Encryptable.uint32(90n)])
        .execute();
      await credit.connect(oracle).fulfillCreditScore(user.address, s[0], s[1]);
    }

    return { credit, oracle, user1, user2, user1Client, user2Client, setScore };
  }

  describe("Confidential benchmarking", function () {
    it("tells each user if they're above the encrypted average, revealing no scores", async function () {
      const { credit, user1, user2, user1Client, user2Client, setScore } = await loadFixture(fixture);

      await setScore(user1, user1Client, 800n); // high
      await setScore(user2, user2Client, 400n); // low  -> average 600

      expect(await credit.benchmarkCount()).to.equal(2n);

      await credit.connect(user1).requestBenchmarkComparison();
      await credit.connect(user2).requestBenchmarkComparison();

      const h1 = await credit.connect(user1).getBenchmarkResult();
      const h2 = await credit.connect(user2).getBenchmarkResult();

      const above1 = await user1Client.decryptForView(h1, FheTypes.Bool).withPermit().execute();
      const above2 = await user2Client.decryptForView(h2, FheTypes.Bool).withPermit().execute();

      expect(above1).to.equal(true); // 800 > 600
      expect(above2).to.equal(false); // 400 < 600
    });
  });

  describe("Encrypted threshold alerts", function () {
    it("answers 'score ≥ threshold?' as an encrypted boolean", async function () {
      const { credit, user1, user1Client, setScore } = await loadFixture(fixture);
      await setScore(user1, user1Client, 720n);

      // Threshold 700 -> true
      let t = await user1Client.encryptInputs([Encryptable.uint32(700n)]).execute();
      await credit.connect(user1).evaluateScoreThreshold(t[0]);
      let h = await credit.connect(user1).getThresholdResult();
      expect(await user1Client.decryptForView(h, FheTypes.Bool).withPermit().execute()).to.equal(true);

      // Threshold 750 -> false
      t = await user1Client.encryptInputs([Encryptable.uint32(750n)]).execute();
      await credit.connect(user1).evaluateScoreThreshold(t[0]);
      h = await credit.connect(user1).getThresholdResult();
      expect(await user1Client.decryptForView(h, FheTypes.Bool).withPermit().execute()).to.equal(false);
    });
  });

  describe("Selective-disclosure passport", function () {
    it("lets a granted viewer decrypt the score, and blocks others", async function () {
      const { credit, user1, user2, user1Client, user2Client, setScore } = await loadFixture(fixture);
      await setScore(user1, user1Client, 815n);

      const scoreHash = (await credit.results(user1.address)).score;

      // user2 cannot read before being granted access.
      let blocked = false;
      try {
        await user2Client.decryptForView(scoreHash, FheTypes.Uint32).withPermit().execute();
      } catch {
        blocked = true;
      }
      expect(blocked).to.equal(true);

      // user1 grants user2 (the "lender") access; now user2 can unseal it.
      await credit.connect(user1).grantScoreAccess(user2.address);
      const seen = await user2Client.decryptForView(scoreHash, FheTypes.Uint32).withPermit().execute();
      expect(seen).to.equal(815n);
    });
  });
});
