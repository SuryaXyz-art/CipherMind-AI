import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("CipherMindCredit", function () {
  async function deployCreditFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [deployer, oracle, user1, user2] = await hre.ethers.getSigners();

    const CipherMindCredit = await hre.ethers.getContractFactory("CipherMindCredit");
    const credit = await CipherMindCredit.connect(deployer).deploy(oracle.address);

    const oracleClient = await hre.cofhe.createClientWithBatteries(oracle);
    const userClient = await hre.cofhe.createClientWithBatteries(user1);

    return { credit, deployer, oracle, user1, user2, oracleClient, userClient };
  }

  describe("Profile Submission", function () {
    it("Should accept an encrypted profile submission", async function () {
      const { credit, user1, userClient } = await loadFixture(deployCreditFixture);

      const encrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(75000n),  // income
          Encryptable.uint32(30n),     // debtRatio (30%)
          Encryptable.uint32(60n),     // historyMonths (5 years)
          Encryptable.uint32(5n),      // openAccounts
        ])
        .execute();

      await credit.connect(user1).submitProfile(
        encrypted[0],
        encrypted[1],
        encrypted[2],
        encrypted[3],
      );

      // Verify profile was submitted
      const profile = await credit.profiles(user1.address);
      expect(profile.submitted).to.be.true;

      // Verify request count
      expect(await credit.requestCount()).to.equal(1n);
    });

    it("Should emit CreditRequested event", async function () {
      const { credit, user1, userClient } = await loadFixture(deployCreditFixture);

      const encrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(50000n),
          Encryptable.uint32(45n),
          Encryptable.uint32(24n),
          Encryptable.uint32(3n),
        ])
        .execute();

      await expect(
        credit.connect(user1).submitProfile(
          encrypted[0],
          encrypted[1],
          encrypted[2],
          encrypted[3],
        ),
      ).to.emit(credit, "CreditRequested");
    });
  });

  describe("Oracle Fulfillment", function () {
    it("Should allow oracle to fulfill a credit score", async function () {
      const { credit, oracle, user1, oracleClient, userClient } =
        await loadFixture(deployCreditFixture);

      // Submit profile
      const profileEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(75000n),
          Encryptable.uint32(30n),
          Encryptable.uint32(60n),
          Encryptable.uint32(5n),
        ])
        .execute();

      await credit.connect(user1).submitProfile(
        profileEncrypted[0],
        profileEncrypted[1],
        profileEncrypted[2],
        profileEncrypted[3],
      );

      // Oracle fulfills the score
      const scoreEncrypted = await oracleClient
        .encryptInputs([
          Encryptable.uint32(720n),  // credit score
          Encryptable.uint32(85n),   // confidence
        ])
        .execute();

      await credit.connect(oracle).fulfillCreditScore(
        user1.address,
        scoreEncrypted[0],
        scoreEncrypted[1],
      );

      // Verify result was stored
      const result = await credit.results(user1.address);
      expect(result.fulfilled).to.be.true;
    });

    it("Should clamp score to valid range (300-850)", async function () {
      const { credit, oracle, user1, oracleClient, userClient } =
        await loadFixture(deployCreditFixture);

      // Submit profile
      const profileEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(10000n),
          Encryptable.uint32(90n),
          Encryptable.uint32(6n),
          Encryptable.uint32(1n),
        ])
        .execute();

      await credit.connect(user1).submitProfile(
        profileEncrypted[0],
        profileEncrypted[1],
        profileEncrypted[2],
        profileEncrypted[3],
      );

      // Attempt to set a score below floor (200)
      const lowScoreEncrypted = await oracleClient
        .encryptInputs([
          Encryptable.uint32(200n),  // Below 300 floor
          Encryptable.uint32(50n),
        ])
        .execute();

      await credit.connect(oracle).fulfillCreditScore(
        user1.address,
        lowScoreEncrypted[0],
        lowScoreEncrypted[1],
      );

      // The score should be clamped to 300
      const scoreHash = (await credit.results(user1.address)).score;
      const plaintext = await hre.cofhe.mocks.getPlaintext(scoreHash);
      expect(plaintext).to.equal(300n);
    });

    it("Should reject non-oracle callers", async function () {
      const { credit, user1, user2, userClient } =
        await loadFixture(deployCreditFixture);

      // Submit profile first
      const profileEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(50000n),
          Encryptable.uint32(40n),
          Encryptable.uint32(36n),
          Encryptable.uint32(4n),
        ])
        .execute();

      await credit.connect(user1).submitProfile(
        profileEncrypted[0],
        profileEncrypted[1],
        profileEncrypted[2],
        profileEncrypted[3],
      );

      // Non-oracle tries to fulfill
      const fakeScoreEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(850n),
          Encryptable.uint32(100n),
        ])
        .execute();

      await expect(
        credit.connect(user2).fulfillCreditScore(
          user1.address,
          fakeScoreEncrypted[0],
          fakeScoreEncrypted[1],
        ),
      ).to.be.revertedWithCustomError(credit, "NotOracle");
    });

    it("Should reject fulfillment for non-submitted profile", async function () {
      const { credit, oracle, user1, oracleClient } =
        await loadFixture(deployCreditFixture);

      const scoreEncrypted = await oracleClient
        .encryptInputs([
          Encryptable.uint32(700n),
          Encryptable.uint32(80n),
        ])
        .execute();

      await expect(
        credit.connect(oracle).fulfillCreditScore(
          user1.address,
          scoreEncrypted[0],
          scoreEncrypted[1],
        ),
      ).to.be.revertedWithCustomError(credit, "ProfileNotSubmitted");
    });
  });

  describe("On-chain Decryption Flow", function () {
    it("Should complete the 3-step decrypt flow for credit score", async function () {
      const { credit, oracle, user1, oracleClient, userClient } =
        await loadFixture(deployCreditFixture);

      // Step 0: Submit profile
      const profileEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(90000n),
          Encryptable.uint32(20n),
          Encryptable.uint32(120n),
          Encryptable.uint32(8n),
        ])
        .execute();

      await credit.connect(user1).submitProfile(
        profileEncrypted[0],
        profileEncrypted[1],
        profileEncrypted[2],
        profileEncrypted[3],
      );

      // Step 0b: Oracle fulfills
      const scoreEncrypted = await oracleClient
        .encryptInputs([
          Encryptable.uint32(780n),
          Encryptable.uint32(92n),
        ])
        .execute();

      await credit.connect(oracle).fulfillCreditScore(
        user1.address,
        scoreEncrypted[0],
        scoreEncrypted[1],
      );

      // Step 1: Allow public decryption
      await credit.connect(user1).allowScorePublicly();

      // Step 2: Decrypt off-chain via SDK
      const scoreHash = (await credit.results(user1.address)).score;
      const confHash = (await credit.results(user1.address)).confidence;

      const scoreResult = await userClient
        .decryptForTx(scoreHash)
        .withoutPermit()
        .execute();

      const confResult = await userClient
        .decryptForTx(confHash)
        .withoutPermit()
        .execute();

      // Step 3: Publish on-chain
      await credit.connect(user1).revealScore(
        scoreResult.decryptedValue,
        scoreResult.signature,
        confResult.decryptedValue,
        confResult.signature,
      );

      // Verify decrypted values
      const [decryptedScore, decryptedConf] = await credit.connect(user1).getDecryptedScore();
      expect(decryptedScore).to.equal(780n);
      expect(decryptedConf).to.equal(92n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update oracle", async function () {
      const { credit, deployer, user1 } = await loadFixture(deployCreditFixture);

      await expect(credit.connect(deployer).setOracle(user1.address))
        .to.emit(credit, "OracleUpdated");
    });

    it("Should reject non-owner oracle updates", async function () {
      const { credit, user1 } = await loadFixture(deployCreditFixture);

      await expect(
        credit.connect(user1).setOracle(user1.address),
      ).to.be.reverted;
    });
  });
});
