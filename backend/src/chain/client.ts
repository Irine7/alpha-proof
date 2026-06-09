import crypto from "node:crypto";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { config, hasChainEnv } from "../config.js";
import type { ChainCommitResult, ChainResolveResult, SignalOutcome } from "../types.js";
import { signalRegistryAbi } from "./SignalRegistryAbi.js";

let mockChainId = 1000;

function mockTxHash(seed: string) {
  return `0x${crypto.createHash("sha256").update(seed).digest("hex")}`;
}

function getContract() {
  const provider = new JsonRpcProvider(config.mantleRpcUrl);
  const wallet = new Wallet(config.agentPrivateKey, provider);
  return new Contract(config.signalRegistryAddress, signalRegistryAbi, wallet);
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

export async function commitSignalOnChain(input: {
  signalType: string;
  asset: string;
  reasoningHash: string;
  dataHash: string;
  confidence: number;
  prediction: number;
  evaluationTime: Date;
}): Promise<ChainCommitResult> {
  if (!hasChainEnv()) {
    mockChainId += 1;
    return {
      chainSignalId: mockChainId,
      txHash: mockTxHash(`commit:${mockChainId}:${input.reasoningHash}:${Date.now()}`),
      mocked: true
    };
  }

  const contract = getContract();
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
  const event = receipt?.logs
    .map((log: unknown) => {
      try {
        return contract.interface.parseLog(log as { topics: string[]; data: string });
      } catch {
        return null;
      }
    })
    .find((parsed: { name?: string } | null) => parsed?.name === "SignalCommitted");

  return {
    chainSignalId: event ? Number(event.args.signalId) : -1,
    txHash: receipt?.hash || tx.hash,
    mocked: false
  };
}

export async function resolveSignalOnChain(chainSignalId: number, outcome: SignalOutcome): Promise<ChainResolveResult> {
  if (!hasChainEnv()) {
    return {
      txHash: mockTxHash(`resolve:${chainSignalId}:${outcome}:${Date.now()}`),
      mocked: true
    };
  }

  const contract = getContract();
  const tx = await contract.resolveSignal(chainSignalId, outcomeToContract(outcome));
  const receipt = await tx.wait();

  return {
    txHash: receipt?.hash || tx.hash,
    mocked: false
  };
}
