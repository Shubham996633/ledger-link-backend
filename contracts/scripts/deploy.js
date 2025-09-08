const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TransactionLogger contract...");

  // Get the contract factory
  const TransactionLogger = await ethers.getContractFactory("TransactionLogger");

  // Deploy the contract
  const transactionLogger = await TransactionLogger.deploy();

  // Wait for deployment to complete
  await transactionLogger.waitForDeployment();

  const contractAddress = await transactionLogger.getAddress();
  console.log("TransactionLogger deployed to:", contractAddress);

  // Get deployer address
  const [deployer] = await ethers.getSigners();
  console.log("Deployed by:", deployer.address);

  // Verify deployment
  console.log("Verifying deployment...");
  const totalTransactions = await transactionLogger.totalTransactions();
  const totalUsers = await transactionLogger.totalUsers();
  const contractBalance = await transactionLogger.getContractStats();
  
  console.log("Contract Stats:");
  console.log("- Total Transactions:", totalTransactions.toString());
  console.log("- Total Users:", totalUsers.toString());
  console.log("- Contract Balance:", ethers.formatEther(contractBalance[2]), "ETH");

  // Add deployer as authorized logger
  console.log("Adding deployer as authorized logger...");
  await transactionLogger.addAuthorizedLogger(deployer.address);
  console.log("Deployer authorized as logger");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: transactionLogger.deploymentTransaction().hash,
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // TODO: Save deployment info to file
  // TODO: Verify contract on block explorer
  // TODO: Initialize contract with any required setup
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
