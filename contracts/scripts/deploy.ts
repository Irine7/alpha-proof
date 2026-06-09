import { ethers } from "hardhat";

async function main() {
  const SignalRegistry = await ethers.getContractFactory("SignalRegistry");
  const registry = await SignalRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`SignalRegistry deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
