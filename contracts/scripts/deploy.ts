import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

async function saveDeployment(address: string, txHash?: string) {
  const chain = await ethers.provider.getNetwork();
  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  const deploymentPath = path.join(deploymentsDir, `${network.name}.json`);

  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    deploymentPath,
    `${JSON.stringify(
      {
        contract: "SignalRegistry",
        address,
        network: network.name,
        chainId: chain.chainId.toString(),
        txHash: txHash || null,
        deployedAt: new Date().toISOString()
      },
      null,
      2
    )}\n`
  );

  console.log(`Deployment saved to ${deploymentPath}`);
}

async function main() {
  const SignalRegistry = await ethers.getContractFactory("SignalRegistry");
  const registry = await SignalRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const txHash = registry.deploymentTransaction()?.hash;

  console.log(`SignalRegistry deployed to ${address}`);

  await saveDeployment(address, txHash);

  if (network.name === "localhost") {
    console.log("For local backend/frontend testing, update these env values manually:");
    console.log(`  backend/.env SIGNAL_REGISTRY_ADDRESS="${address}"`);
    console.log(`  frontend/.env.local NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS="${address}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
