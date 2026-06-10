import crypto from "node:crypto";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { assertChainConfigured, config, shouldUseMockChain } from "../config.js";
import type { ChainCommitResult, ChainResolveResult, ChainSignalRead, SignalOutcome, SignalStatus } from "../types.js";
import { signalRegistryAbi } from "./SignalRegistryAbi.js";

let mockChainId = 1000;

function mockTxHash(seed: string) {
  return `0x${crypto.createHash("sha256").update(seed).digest("hex")}`;
}

function getClient() {
  const provider = new JsonRpcProvider(config.mantleRpcUrl);
  const wallet = new Wallet(config.agentPrivateKey, provider);
  const contract = new Contract(config.signalRegistryAddress, signalRegistryAbi, wallet);
  return { contract, provider };
}

async function assertRegistryDeployed(provider: JsonRpcProvider) {
  const code = await provider.getCode(config.signalRegistryAddress);
  if (code === "0x") {
    throw new Error("No SignalRegistry contract found at SIGNAL_REGISTRY_ADDRESS on the configured RPC");
  }
}

function outcomeToContract(outcome: SignalOutcome) {
  const map: Record<SignalOutcome, number> = {
    Unknown: 0,
    Correct: 1,
    Failed: 2,
    Inconclusive: 3
  };
  return map[outcome];
}

function outcomeFromContract(outcome: number): SignalOutcome {
  const map: Record<number, SignalOutcome> = {
    0: "Unknown",
    1: "Correct",
    2: "Failed",
    3: "Inconclusive"
  };
  return map[outcome] || "Unknown";
}

function statusFromContract(status: number): SignalStatus {
  return status === 1 ? "Resolved" : "Pending";
}

export async function commitSignalOnChain(input: {
  signalType: string;
  asset: string;
  reasoningHash: string;
  dataHash: string;
  confidence: number;
  prediction: number;
  evaluationTime: Date;
}): Promise<ChainCommitResult> {
  if (shouldUseMockChain()) {
    mockChainId += 1;
    return {
      chainSignalId: mockChainId,
      txHash: mockTxHash(`commit:${mockChainId}:${input.reasoningHash}:${Date.now()}`),
      mocked: true
    };
  }

  assertChainConfigured();

  const { contract, provider } = getClient();
  await assertRegistryDeployed(provider);
  const tx = await contract.commitSignal(
    input.signalType,
    input.asset,
    input.reasoningHash,
    input.dataHash,
    input.confidence,
    input.prediction,
    Math.floor(input.evaluationTime.getTime() / 1000)
  );
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("SignalRegistry commit transaction did not return a receipt");
  }

  const event = receipt?.logs
    .map((log: unknown) => {
      try {
        return contract.interface.parseLog(log as { topics: string[]; data: string });
      } catch {
        return null;
      }
    })
    .find((parsed: { name?: string } | null) => parsed?.name === "SignalCommitted");

  if (!event) {
    throw new Error("SignalCommitted event was not found in the transaction receipt");
  }

  return {
    chainSignalId: Number(event.args.signalId),
    txHash: receipt?.hash || tx.hash,
    mocked: false
  };
}

export async function resolveSignalOnChain(chainSignalId: number, outcome: SignalOutcome): Promise<ChainResolveResult> {
  if (shouldUseMockChain()) {
    return {
      txHash: mockTxHash(`resolve:${chainSignalId}:${outcome}:${Date.now()}`),
      mocked: true
    };
  }

  assertChainConfigured();

  const { contract, provider } = getClient();
  await assertRegistryDeployed(provider);
  const tx = await contract.resolveSignal(chainSignalId, outcomeToContract(outcome));
  const receipt = await tx.wait();

  return {
    txHash: receipt?.hash || tx.hash,
    mocked: false
  };
}

export async function readSignalOnChain(chainSignalId: number): Promise<ChainSignalRead | null> {
  if (shouldUseMockChain()) return null;

  assertChainConfigured();

  const { contract, provider } = getClient();
  await assertRegistryDeployed(provider);
  const signal = await contract.getSignal(chainSignalId);

  return {
    id: Number(signal.id),
    signalType: signal.signalType,
    asset: signal.asset,
    reasoningHash: signal.reasoningHash,
    dataHash: signal.dataHash,
    confidence: Number(signal.confidence),
    prediction: Number(signal.prediction),
    status: statusFromContract(Number(signal.status)),
    outcome: outcomeFromContract(Number(signal.outcome))
  };
}
