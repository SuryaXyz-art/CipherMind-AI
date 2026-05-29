/**
 * Tests the three confidential features on CipherMindTrading:
 *   1. Strength benchmarking — "is my signal confidence above average?" (encrypted)
 *   2. Risk threshold alert   — "is my risk ≥ X?" (encrypted, X private)
 *   3. Selective-disclosure   — grant ONE viewer (copy-trader/fund) access
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("CipherMindTrading confidential features", function () {
  async function fixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);
    const [deployer, oracle, user1, user2] = await hre.ethers.getSigners();

    const Trading = await hre.ethers.getContractFactory("CipherMindTrading");
    const trading = await Trading.connect(deployer).deploy(oracle.address);

    const oracleClient = await hre.cofhe.createClientWithBatteries(oracle);
    const user1Client = await hre.cofhe.createClientWithBatteries(user1);
    const user2Client = await hre.cofhe.createClientWithBatteries(user2);

    // Submit a dummy position then have the oracle fulfill an exact signal.
    async function setSignal(
      user: any,
      userClient: any,
      sig: { direction: bigint; strength: bigint; risk: bigint; entry: bigint },
    ) {
      const p = await userClient
        .encryptInputs([
          Encryptable.uint32(5000n),
          Encryptable.uint32(300000n),
          Encryptable.uint32(294000n),
          Encryptable.uint32(318000n),
          Encryptable.uint32(7n),
        ])
        .execute();
      await trading.connect(user).submitPosition(p[0], p[1], p[2], p[3], p[4], "ETH");

      const s = await oracleClient
        .encryptInputs([
          Encryptable.uint32(sig.direction),
          Encryptable.uint32(sig.strength),
          Encryptable.uint32(sig.risk),
          Encryptable.uint32(sig.entry),
        ])
        .execute();
      await trading.connect(oracle).fulfillSignal(user.address, s[0], s[1], s[2], s[3]);
    }

    return { trading, oracle, user1, user2, user1Client, user2Client, setSignal };
  }

  describe("Strength benchmarking", function () {
    it("tells each user if their signal confidence is above the encrypted average", async function () {
      const { trading, user1, user2, user1Client, user2Client, setSignal } = await loadFixture(fixture);

      await setSignal(user1, user1Client, { direction: 1n, strength: 80n, risk: 30n, entry: 300000n });
      await setSignal(user2, user2Client, { direction: 1n, strength: 40n, risk: 60n, entry: 300000n }); // avg 60

      expect(await trading.benchmarkCount()).to.equal(2n);

      await trading.connect(user1).requestStrengthBenchmark();
      await trading.connect(user2).requestStrengthBenchmark();

      const h1 = await trading.connect(user1).getBenchmarkResult();
      const h2 = await trading.connect(user2).getBenchmarkResult();
      expect(await user1Client.decryptForView(h1, FheTypes.Bool).withPermit().execute()).to.equal(true);
      expect(await user2Client.decryptForView(h2, FheTypes.Bool).withPermit().execute()).to.equal(false);
    });
  });

  describe("Risk threshold alerts", function () {
    it("answers 'risk ≥ threshold?' as an encrypted boolean", async function () {
      const { trading, user1, user1Client, setSignal } = await loadFixture(fixture);
      await setSignal(user1, user1Client, { direction: 2n, strength: 55n, risk: 70n, entry: 300000n });

      let t = await user1Client.encryptInputs([Encryptable.uint32(60n)]).execute();
      await trading.connect(user1).evaluateRiskThreshold(t[0]);
      let h = await trading.connect(user1).getRiskThresholdResult();
      expect(await user1Client.decryptForView(h, FheTypes.Bool).withPermit().execute()).to.equal(true); // 70 >= 60

      t = await user1Client.encryptInputs([Encryptable.uint32(80n)]).execute();
      await trading.connect(user1).evaluateRiskThreshold(t[0]);
      h = await trading.connect(user1).getRiskThresholdResult();
      expect(await user1Client.decryptForView(h, FheTypes.Bool).withPermit().execute()).to.equal(false); // 70 < 80
    });
  });

  describe("Selective-disclosure signal sharing", function () {
    it("lets a granted viewer decrypt the signal, and blocks others", async function () {
      const { trading, user1, user2, user1Client, user2Client, setSignal } = await loadFixture(fixture);
      await setSignal(user1, user1Client, { direction: 1n, strength: 88n, risk: 25n, entry: 305000n });

      const strengthHash = (await trading.latestSignal(user1.address)).strength;

      let blocked = false;
      try {
        await user2Client.decryptForView(strengthHash, FheTypes.Uint32).withPermit().execute();
      } catch {
        blocked = true;
      }
      expect(blocked).to.equal(true);

      await trading.connect(user1).grantSignalAccess(user2.address);
      const seen = await user2Client.decryptForView(strengthHash, FheTypes.Uint32).withPermit().execute();
      expect(seen).to.equal(88n);
    });
  });
});
