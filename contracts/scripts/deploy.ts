import fs from "node:fs";
import path from "node:path";
import { ethers, network } from "hardhat";

async function saveDeployment(address: string, txHash?: string) {
  const chain = await ethers.provider.getNetwork();
  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  const deploymentName = network.name === "mantleTestnet" ? "mantle-testnet" : network.name;
  const explorerBase =
    network.name === "mantleTestnet"
      ? process.env.MANTLE_TESTNET_EXPLORER_URL || "https://explorer.sepolia.mantle.xyz"
      : "";
  const deploymentPath = path.join(deploymentsDir, `${deploymentName}.json`);

  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    deploymentPath,
    `${JSON.stringify(
      network.name === "mantleTestnet"
        ? {
            network: "mantle-testnet",
            chainId: Number(chain.chainId),
            signalRegistry: address,
            deployedAt: new Date().toISOString(),
            explorerUrl: `${explorerBase}/address/${address}`
          }
        : {
            contract: "SignalRegistry",
            address,
            signalRegistry: address,
            network: network.name,
            chainId: Number(chain.chainId),
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

  if (network.name === "localhost" || network.name === "mantleTestnet") {
    console.log("Update backend/.env manually with the deployed SignalRegistry address:");
    console.log(`  backend/.env SIGNAL_REGISTRY_ADDRESS="${address}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
