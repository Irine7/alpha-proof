import { expect } from "chai";
import { ethers } from "hardhat";

describe("SignalRegistry", () => {
  async function deployRegistry() {
    const [agent, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("SignalRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return { registry, agent, other };
  }

  it("commits a signal and stores all fields", async () => {
    const { registry, agent } = await deployRegistry();
    const reasoningHash = ethers.keccak256(ethers.toUtf8Bytes("reasoning"));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("data"));
    const evaluationTime = Math.floor(Date.now() / 1000) + 3600;

    await expect(
      registry.commitSignal("Whale Accumulation", "MNT", reasoningHash, dataHash, 82, 1, evaluationTime)
    )
      .to.emit(registry, "SignalCommitted")
      .withArgs(0, agent.address, "Whale Accumulation", "MNT", 82, 1, evaluationTime);

    const signal = await registry.getSignal(0);
    expect(signal.id).to.equal(0);
    expect(signal.agent).to.equal(agent.address);
    expect(signal.signalType).to.equal("Whale Accumulation");
    expect(signal.asset).to.equal("MNT");
    expect(signal.reasoningHash).to.equal(reasoningHash);
    expect(signal.dataHash).to.equal(dataHash);
    expect(signal.confidence).to.equal(82);
    expect(signal.prediction).to.equal(1);
    expect(signal.evaluationTime).to.equal(evaluationTime);
    expect(signal.status).to.equal(0);
    expect(signal.outcome).to.equal(0);
    expect(await registry.getSignalsCount()).to.equal(1);
  });

  it("validates confidence and prediction", async () => {
    const { registry } = await deployRegistry();
    const hash = ethers.ZeroHash;
    const evaluationTime = Math.floor(Date.now() / 1000) + 3600;

    await expect(registry.commitSignal("Risk", "MNT", hash, hash, 101, -1, evaluationTime)).to.be.revertedWithCustomError(
      registry,
      "InvalidConfidence"
    );
    await expect(registry.commitSignal("Risk", "MNT", hash, hash, 50, 2, evaluationTime)).to.be.revertedWithCustomError(
      registry,
      "InvalidPrediction"
    );
  });

  it("only lets the original agent resolve a pending signal", async () => {
    const { registry, agent, other } = await deployRegistry();
    const hash = ethers.ZeroHash;
    const evaluationTime = Math.floor(Date.now() / 1000) + 3600;

    await registry.commitSignal("Liquidity Shock", "USDT/MNT", hash, hash, 76, -1, evaluationTime);

    await expect(registry.connect(other).resolveSignal(0, 1)).to.be.revertedWithCustomError(registry, "OnlyOriginalAgent");

    await expect(registry.connect(agent).resolveSignal(0, 1))
      .to.emit(registry, "SignalResolved")
      .withArgs(0, agent.address, 1);

    const signal = await registry.getSignal(0);
    expect(signal.status).to.equal(1);
    expect(signal.outcome).to.equal(1);

    await expect(registry.resolveSignal(0, 2)).to.be.revertedWithCustomError(registry, "SignalAlreadyResolved");
  });

  it("rejects resolving missing signals and Unknown outcome", async () => {
    const { registry } = await deployRegistry();
    const hash = ethers.ZeroHash;
    const evaluationTime = Math.floor(Date.now() / 1000) + 3600;

    await expect(registry.resolveSignal(99, 1)).to.be.revertedWithCustomError(registry, "SignalDoesNotExist");
    await registry.commitSignal("Smart Wallet Activity", "mETH", hash, hash, 68, 0, evaluationTime);
    await expect(registry.resolveSignal(0, 0)).to.be.revertedWithCustomError(registry, "InvalidOutcome");
  });
});
