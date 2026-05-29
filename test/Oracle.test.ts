/**
 * End-to-end test of the REAL oracle loop on the CoFHE mocks.
 *
 * Proves that the oracle can: decrypt the user's submitted ciphertext via its
 * FHE.allow permit, anonymize, run inference (injected offline here), re-encrypt
 * the result, and fulfill it on-chain — and that the user can then unseal it.
 *
 * Inference is injected (no network / no API key needed) but ALSO asserts the
 * oracle handed it correctly-decrypted bands, which is the whole point.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable } from "@cofhe/sdk";
import { expect } from "chai";
import { fulfillCreditRequest, fulfillTradingRequest } from "../backend/oracleLogic";
import type { CreditScoreResult } from "../backend/creditScorer";
import type { TradingSignalResult } from "../backend/tradingSignal";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("Oracle real loop (mocks)", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, oracle, user1] = await hre.ethers.getSigners();

    const Credit = await hre.ethers.getContractFactory("CipherMindCredit");
    const credit = await Credit.connect(deployer).deploy(oracle.address);

    const Trading = await hre.ethers.getContractFactory("CipherMindTrading");
    const trading = await Trading.connect(deployer).deploy(oracle.address);

    const oracleClient = await hre.cofhe.createClientWithBatteries(oracle);
    const userClient = await hre.cofhe.createClientWithBatteries(user1);

    return { credit, trading, oracle, user1, oracleClient, userClient };
  }

  it("decrypts the submitted profile, fulfills, and the user can unseal the score", async function () {
    const { credit, oracle, user1, oracleClient, userClient } = await loadFixture(fixture);

    // User submits an encrypted profile.
    const enc = await userClient
      .encryptInputs([
        Encryptable.uint32(82000n), // income  -> "high"
        Encryptable.uint32(18n), // debtRatio   -> "low"
        Encryptable.uint32(90n), // historyMonths -> "extensive"
        Encryptable.uint32(6n), // openAccounts  -> "moderate"
      ])
      .execute();
    await credit.connect(user1).submitProfile(enc[0], enc[1], enc[2], enc[3]);

    // Offline inference that ASSERTS the oracle decrypted + anonymized correctly.
    const fakeInfer = async (bands: any): Promise<CreditScoreResult> => {
      expect(bands.incomeBand).to.equal("high");
      expect(bands.debtRatioBand).to.equal("low");
      expect(bands.historyBand).to.equal("extensive");
      expect(bands.accountsBand).to.equal("moderate");
      return { score: 766, confidence: 91, reasoning: "test" };
    };

    const { raw, result } = await fulfillCreditRequest(
      oracleClient,
      credit.connect(oracle),
      user1.address,
      fakeInfer,
    );

    // The oracle saw the true raw values (decryption worked).
    expect(raw.income).to.equal(82000);
    expect(raw.debtRatio).to.equal(18);
    expect(result.score).to.equal(766);

    // Result is stored encrypted; user runs the 3-step reveal to read it.
    expect((await credit.results(user1.address)).fulfilled).to.be.true;
    await credit.connect(user1).allowScorePublicly();

    const scoreHash = (await credit.results(user1.address)).score;
    const confHash = (await credit.results(user1.address)).confidence;
    const s = await userClient.decryptForTx(scoreHash).withoutPermit().execute();
    const c = await userClient.decryptForTx(confHash).withoutPermit().execute();
    await credit.connect(user1).revealScore(s.decryptedValue, s.signature, c.decryptedValue, c.signature);

    const [score, confidence] = await credit.connect(user1).getDecryptedScore();
    expect(score).to.equal(766n);
    expect(confidence).to.equal(91n);
  });

  it("decrypts a trading position, fulfills a signal, and the user can unseal it", async function () {
    const { trading, oracle, user1, oracleClient, userClient } = await loadFixture(fixture);

    // position size 8000 -> "medium"; entry 300000 (=$3000), SL 294000, TP 318000
    // risk=6000, reward=18000 -> RR=3 -> "excellent"; SL%=2% -> "moderate"; risk tol 8 -> "aggressive"
    const enc = await userClient
      .encryptInputs([
        Encryptable.uint32(8000n),
        Encryptable.uint32(300000n),
        Encryptable.uint32(294000n),
        Encryptable.uint32(318000n),
        Encryptable.uint32(8n),
      ])
      .execute();
    await trading.connect(user1).submitPosition(enc[0], enc[1], enc[2], enc[3], enc[4], "ETH");

    const fakeInfer = async (bands: any): Promise<TradingSignalResult> => {
      expect(bands.positionSizeBand).to.equal("medium");
      expect(bands.riskRewardRatio).to.equal("excellent");
      expect(bands.asset).to.equal("ETH");
      return { direction: 1, strength: 72, riskLevel: 38, suggestedEntryAdjustment: 0, reasoning: "test" };
    };

    const { result } = await fulfillTradingRequest(
      oracleClient,
      trading.connect(oracle),
      user1.address,
      "ETH",
      fakeInfer,
    );
    expect(result.direction).to.equal(1);

    expect((await trading.latestSignal(user1.address)).fulfilled).to.be.true;
    await trading.connect(user1).allowSignalPublicly();

    const sig = await trading.latestSignal(user1.address);
    const dir = await userClient.decryptForTx(sig.direction).withoutPermit().execute();
    const str = await userClient.decryptForTx(sig.strength).withoutPermit().execute();
    const risk = await userClient.decryptForTx(sig.riskLevel).withoutPermit().execute();
    const entry = await userClient.decryptForTx(sig.suggestedEntry).withoutPermit().execute();
    await trading
      .connect(user1)
      .revealSignal(
        dir.decryptedValue, dir.signature,
        str.decryptedValue, str.signature,
        risk.decryptedValue, risk.signature,
        entry.decryptedValue, entry.signature,
      );

    expect(dir.decryptedValue).to.equal(1n);
    expect(str.decryptedValue).to.equal(72n);
    expect(entry.decryptedValue).to.equal(300000n); // 0% adjustment
  });
});
