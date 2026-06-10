import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

type Deployment = {
  address?: string;
  signalRegistry?: string;
};

function getSignalId() {
  const raw = process.env.SIGNAL_ID || process.argv.find((arg) => /^\d+$/.test(arg));
  return raw === undefined ? null : BigInt(raw);
}

function getRegistryAddress() {
  if (process.env.SIGNAL_REGISTRY_ADDRESS) {
    return process.env.SIGNAL_REGISTRY_ADDRESS;
  }

  const deploymentPath = path.resolve(__dirname, "..", "deployments", `${network.name}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      `SIGNAL_REGISTRY_ADDRESS is not set and no deployment file was found at ${deploymentPath}`
    );
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as Deployment;

  const address = deployment.signalRegistry || deployment.address;

  if (!address) {
    throw new Error(`Deployment file ${deploymentPath} does not contain an address`);
  }

  return address;
}

async function main() {
  const address = getRegistryAddress();
  const signalId = getSignalId();
  const registry = await ethers.getContractAt("SignalRegistry", address);
  const count = await registry.getSignalsCount();

  console.log(`SignalRegistry: ${address}`);
  console.log(`Network: ${network.name}`);
  console.log(`Signals count: ${count.toString()}`);

  if (signalId === null) {
    return;
  }

  const signal = await registry.getSignal(signalId);
  console.log(
    JSON.stringify(
      {
        id: signal.id.toString(),
        agent: signal.agent,
        signalType: signal.signalType,
        asset: signal.asset,
        reasoningHash: signal.reasoningHash,
        dataHash: signal.dataHash,
        confidence: signal.confidence.toString(),
        prediction: signal.prediction.toString(),
        createdAt: signal.createdAt.toString(),
        evaluationTime: signal.evaluationTime.toString(),
        status: signal.status.toString(),
        outcome: signal.outcome.toString()
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
