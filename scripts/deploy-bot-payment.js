const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BotPayment contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Set the moderator address - for simplicity, using the deployer
  // In production, you might want to use a different address
  const moderatorAddress = deployer.address;
  console.log(`Setting moderator as: ${moderatorAddress}`);

  // Deploy the BotPayment contract
  const BotPayment = await ethers.getContractFactory("BotPayment");
  const botPayment = await BotPayment.deploy(moderatorAddress);

  // Wait for deployment to complete
  await botPayment.waitForDeployment();
  const contractAddress = await botPayment.getAddress();

  console.log(`BotPayment deployed to: ${contractAddress}`);
  console.log(`Moderator set to: ${moderatorAddress}`);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`Contract name: BotPayment`);
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Moderator: ${moderatorAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Explorer URL: https://explorer.testnet.monad.xyz/address/${contractAddress}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });