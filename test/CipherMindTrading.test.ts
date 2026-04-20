import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { expect } from "chai";

const TASK_COFHE_MOCKS_DEPLOY = "task:cofhe-mocks:deploy";

describe("CipherMindTrading", function () {
  async function deployTradingFixture() {
    await hre.run(TASK_COFHE_MOCKS_DEPLOY);

    const [deployer, oracle, user1, user2] = await hre.ethers.getSigners();

    const CipherMindTrading = await hre.ethers.getContractFactory("CipherMindTrading");
    const trading = await CipherMindTrading.connect(deployer).deploy(oracle.address);

    const oracleClient = await hre.cofhe.createClientWithBatteries(oracle);
    const userClient = await hre.cofhe.createClientWithBatteries(user1);

    return { trading, deployer, oracle, user1, user2, oracleClient, userClient };
  }

  describe("Position Submission", function () {
    it("Should accept an encrypted position submission", async function () {
      const { trading, user1, userClient } = await loadFixture(deployTradingFixture);

      const encrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(5000n),   // positionSize ($5000)
          Encryptable.uint32(350000n), // entryPrice ($3500.00)
          Encryptable.uint32(340000n), // stopLoss ($3400.00)
          Encryptable.uint32(380000n), // takeProfit ($3800.00)
          Encryptable.uint32(7n),      // riskTolerance (7/10)
        ])
        .execute();

      await trading.connect(user1).submitPosition(
        encrypted[0],
        encrypted[1],
        encrypted[2],
        encrypted[3],
        encrypted[4],
        "ETH",
      );

      // Verify submission
      expect(await trading.signalCount(user1.address)).to.equal(1n);
      expect(await trading.totalRequests()).to.equal(1n);
    });

    it("Should emit SignalRequested event with asset name", async function () {
      const { trading, user1, userClient } = await loadFixture(deployTradingFixture);

      const encrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(10000n),
          Encryptable.uint32(6500000n), // BTC ~$65000
          Encryptable.uint32(6300000n),
          Encryptable.uint32(7000000n),
          Encryptable.uint32(5n),
        ])
        .execute();

      await expect(
        trading.connect(user1).submitPosition(
          encrypted[0],
          encrypted[1],
          encrypted[2],
          encrypted[3],
          encrypted[4],
          "BTC",
        ),
      ).to.emit(trading, "SignalRequested").withArgs(user1.address, "BTC", 1n);
    });

    it("Should track position history", async function () {
      const { trading, user1, userClient } = await loadFixture(deployTradingFixture);

      // Submit 2 positions
      for (let i = 0; i < 2; i++) {
        const encrypted = await userClient
          .encryptInputs([
            Encryptable.uint32(BigInt(5000 + i * 1000)),
            Encryptable.uint32(350000n),
            Encryptable.uint32(340000n),
            Encryptable.uint32(380000n),
            Encryptable.uint32(5n),
          ])
          .execute();

        await trading.connect(user1).submitPosition(
          encrypted[0],
          encrypted[1],
          encrypted[2],
          encrypted[3],
          encrypted[4],
          "ETH",
        );
      }

      expect(await trading.getPositionCount(user1.address)).to.equal(2n);
    });
  });

  describe("Oracle Fulfillment", function () {
    it("Should allow oracle to fulfill a trading signal", async function () {
      const { trading, oracle, user1, oracleClient, userClient } =
        await loadFixture(deployTradingFixture);

      // Submit position
      const positionEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(5000n),
          Encryptable.uint32(350000n),
          Encryptable.uint32(340000n),
          Encryptable.uint32(380000n),
          Encryptable.uint32(7n),
        ])
        .execute();

      await trading.connect(user1).submitPosition(
        positionEncrypted[0],
        positionEncrypted[1],
        positionEncrypted[2],
        positionEncrypted[3],
        positionEncrypted[4],
        "ETH",
      );

      // Oracle fulfills signal
      const signalEncrypted = await oracleClient
        .encryptInputs([
          Encryptable.uint32(1n),      // BUY
          Encryptable.uint32(78n),     // strength 78%
          Encryptable.uint32(35n),     // risk 35%
          Encryptable.uint32(348500n), // suggested entry $3485.00
        ])
        .execute();

      await trading.connect(oracle).fulfillSignal(
        user1.address,
        signalEncrypted[0],
        signalEncrypted[1],
        signalEncrypted[2],
        signalEncrypted[3],
      );

      // Verify signal was stored
      const signal = await trading.latestSignal(user1.address);
      expect(signal.fulfilled).to.be.true;
    });

    it("Should reject non-oracle callers", async function () {
      const { trading, user1, user2, userClient } =
        await loadFixture(deployTradingFixture);

      // Submit position first
      const positionEncrypted = await userClient
        .encryptInputs([
          Encryptable.uint32(5000n),
          Encryptable.uint32(350000n),
          Encryptable.uint32(340000n),
          Encryptable.uint32(380000n),
          Encryptable.uint32(7n),
        ])
        .execute();

      await trading.connect(user1).submitPosition(
        positionEncrypted[0],
        positionEncrypted[1],
        positionEncrypted[2],
        positionEncrypted[3],
        positionEncrypted[4],
        "ETH",
      );

      // Non-oracle tries to fulfill
      const fakeSignal = await userClient
        .encryptInputs([
          Encryptable.uint32(1n),
          Encryptable.uint32(100n),
          Encryptable.uint32(0n),
          Encryptable.uint32(350000n),
        ])
        .execute();

      await expect(
        trading.connect(user2).fulfillSignal(
          user1.address,
          fakeSignal[0],
          fakeSignal[1],
          fakeSignal[2],
          fakeSignal[3],
        ),
      ).to.be.revertedWithCustomError(trading, "NotOracle");
    });
  });

  describe("Mock Logging", function () {
    it("Should log FHE operations during position submission", async function () {
      const { trading, user1, userClient } = await loadFixture(deployTradingFixture);

      await hre.cofhe.mocks.withLogs("trading.submitPosition()", async () => {
        const encrypted = await userClient
          .encryptInputs([
            Encryptable.uint32(5000n),
            Encryptable.uint32(350000n),
            Encryptable.uint32(340000n),
            Encryptable.uint32(380000n),
            Encryptable.uint32(7n),
          ])
          .execute();

        await trading.connect(user1).submitPosition(
          encrypted[0],
          encrypted[1],
          encrypted[2],
          encrypted[3],
          encrypted[4],
          "ETH",
        );
      });

      expect(await trading.signalCount(user1.address)).to.equal(1n);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update oracle", async function () {
      const { trading, deployer, user1 } = await loadFixture(deployTradingFixture);

      await expect(trading.connect(deployer).setOracle(user1.address))
        .to.emit(trading, "OracleUpdated");
    });
  });
});
