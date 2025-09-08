const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Ledger Link Smart Contract Deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy TransactionLogger contract
  console.log("\n📜 Deploying TransactionLogger contract...");
  const TransactionLogger = await ethers.getContractFactory("TransactionLogger");
  const transactionLogger = await TransactionLogger.deploy();
  await transactionLogger.waitForDeployment();

  const transactionLoggerAddress = await transactionLogger.getAddress();
  console.log("✅ TransactionLogger deployed to:", transactionLoggerAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalTransactions = await transactionLogger.totalTransactions();
  const totalUsers = await transactionLogger.totalUsers();
  const contractBalance = await transactionLogger.getContractStats();
  
  console.log("Contract Stats:");
  console.log("- Total Transactions:", totalTransactions.toString());
  console.log("- Total Users:", totalUsers.toString());
  console.log("- Contract Balance:", ethers.formatEther(contractBalance[2]), "ETH");

  // Add deployer as authorized logger
  console.log("\n🔐 Setting up authorization...");
  await transactionLogger.addAuthorizedLogger(deployer.address);
  console.log("✅ Deployer authorized as logger");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: await deployer.provider.getNetwork().then(n => n.chainId),
    deployer: deployer.address,
    contracts: {
      TransactionLogger: transactionLoggerAddress,
    },
    deploymentTime: new Date().toISOString(),
    transactionHash: transactionLogger.deploymentTransaction().hash,
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require('fs');
  const deploymentFile = `deployments/${hre.network.name}-deployment.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Instructions for verification
  console.log("\n🔍 To verify contracts on block explorer, run:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${transactionLoggerAddress}`);

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
