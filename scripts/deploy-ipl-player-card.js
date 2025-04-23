const { ethers, network } = require("hardhat");

async function main() {
  console.log("Deploying IPLPlayerCard contract to Monad testnet...");

  // Get the contract factory
  const IPLPlayerCard = await ethers.getContractFactory("IPLPlayerCard");
  
  // Deploy the contract
  const iplPlayerCard = await IPLPlayerCard.deploy();
  
  // Wait for the contract to be deployed
  await iplPlayerCard.waitForDeployment();
  
  // Get the deployment transaction
  const deploymentTx = iplPlayerCard.deploymentTransaction();
  
  console.log(`IPLPlayerCard deployed to: ${await iplPlayerCard.getAddress()}`);
  console.log("Deployment transaction hash:", deploymentTx.hash);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await deploymentTx.wait(2); // Reduced from 5 to 2 for faster feedback
  console.log("Contract deployment confirmed!");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`Contract name: IPLPlayerCard`);
  console.log(`Contract address: ${await iplPlayerCard.getAddress()}`);
  console.log(`Network: ${network.name}`);
  console.log(`Explorer URL: https://explorer.testnet.monad.xyz/address/${await iplPlayerCard.getAddress()}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });