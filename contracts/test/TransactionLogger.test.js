const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransactionLogger", function () {
  let transactionLogger;
  let owner;
  let user1;
  let user2;
  let authorizedLogger;

  beforeEach(async function () {
    [owner, user1, user2, authorizedLogger] = await ethers.getSigners();
    
    const TransactionLogger = await ethers.getContractFactory("TransactionLogger");
    transactionLogger = await TransactionLogger.deploy();
    await transactionLogger.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await transactionLogger.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero transactions and users", async function () {
      const [totalTransactions, totalUsers] = await transactionLogger.getContractStats();
      expect(totalTransactions).to.equal(0);
      expect(totalUsers).to.equal(0);
    });
  });

  describe("User Registration", function () {
    it("Should allow user registration", async function () {
      await transactionLogger.connect(user1).registerUser("testuser1");
      
      const user = await transactionLogger.getUser(user1.address);
      expect(user.username).to.equal("testuser1");
      expect(user.isActive).to.be.true;
      expect(user.transactionCount).to.equal(0);
    });

    it("Should prevent duplicate user registration", async function () {
      await transactionLogger.connect(user1).registerUser("testuser1");
      
      await expect(
        transactionLogger.connect(user1).registerUser("testuser1_duplicate")
      ).to.be.revertedWith("User already registered");
    });

    it("Should prevent empty username", async function () {
      await expect(
        transactionLogger.connect(user1).registerUser("")
      ).to.be.revertedWith("Username cannot be empty");
    });
  });

  describe("Transaction Logging", function () {
    beforeEach(async function () {
      // Add authorized logger
      await transactionLogger.addAuthorizedLogger(authorizedLogger.address);
      
      // Register users
      await transactionLogger.connect(user1).registerUser("testuser1");
      await transactionLogger.connect(user2).registerUser("testuser2");
    });

    it("Should log transaction successfully", async function () {
      const metadata = JSON.stringify({ type: "transfer", description: "Test transaction" });
      
      const tx = await transactionLogger
        .connect(authorizedLogger)
        .logTransaction(user1.address, user2.address, ethers.parseEther("1.0"), metadata);
      
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      
      expect(event).to.not.be.undefined;
    });

    it("Should prevent unauthorized transaction logging", async function () {
      const metadata = JSON.stringify({ type: "transfer" });
      
      await expect(
        transactionLogger
          .connect(user1)
          .logTransaction(user1.address, user2.address, ethers.parseEther("1.0"), metadata)
      ).to.be.revertedWith("Not authorized to log transactions");
    });

    it("Should prevent logging with zero amount", async function () {
      const metadata = JSON.stringify({ type: "transfer" });
      
      await expect(
        transactionLogger
          .connect(authorizedLogger)
          .logTransaction(user1.address, user2.address, 0, metadata)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should prevent logging with invalid addresses", async function () {
      const metadata = JSON.stringify({ type: "transfer" });
      
      await expect(
        transactionLogger
          .connect(authorizedLogger)
          .logTransaction(ethers.ZeroAddress, user2.address, ethers.parseEther("1.0"), metadata)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Transaction Status Updates", function () {
    let transactionId;

    beforeEach(async function () {
      // Add authorized logger
      await transactionLogger.addAuthorizedLogger(authorizedLogger.address);
      
      // Register users
      await transactionLogger.connect(user1).registerUser("testuser1");
      await transactionLogger.connect(user2).registerUser("testuser2");
      
      // Log a transaction
      const metadata = JSON.stringify({ type: "transfer" });
      const tx = await transactionLogger
        .connect(authorizedLogger)
        .logTransaction(user1.address, user2.address, ethers.parseEther("1.0"), metadata);
      
      const receipt = await tx.wait();
      const event = receipt.logs[0];
      transactionId = event.topics[1]; // transactionId is the first indexed parameter
    });

    it("Should update transaction status", async function () {
      await transactionLogger
        .connect(authorizedLogger)
        .updateTransactionStatus(transactionId, 1, "Confirmed");
      
      const transaction = await transactionLogger.getTransaction(transactionId);
      expect(transaction.status).to.equal(1);
    });

    it("Should prevent invalid status updates", async function () {
      await expect(
        transactionLogger
          .connect(authorizedLogger)
          .updateTransactionStatus(transactionId, 5, "Invalid status")
      ).to.be.revertedWith("Invalid status");
    });

    it("Should prevent status update for non-existent transaction", async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      
      await expect(
        transactionLogger
          .connect(authorizedLogger)
          .updateTransactionStatus(fakeId, 1, "Confirmed")
      ).to.be.revertedWith("Transaction not found");
    });
  });

  describe("Authorization Management", function () {
    it("Should allow owner to add authorized logger", async function () {
      await transactionLogger.addAuthorizedLogger(authorizedLogger.address);
      
      const isAuthorized = await transactionLogger.authorizedLoggers(authorizedLogger.address);
      expect(isAuthorized).to.be.true;
    });

    it("Should allow owner to remove authorized logger", async function () {
      await transactionLogger.addAuthorizedLogger(authorizedLogger.address);
      await transactionLogger.removeAuthorizedLogger(authorizedLogger.address);
      
      const isAuthorized = await transactionLogger.authorizedLoggers(authorizedLogger.address);
      expect(isAuthorized).to.be.false;
    });

    it("Should prevent non-owner from managing authorization", async function () {
      await expect(
        transactionLogger.connect(user1).addAuthorizedLogger(authorizedLogger.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause contract", async function () {
      await transactionLogger.pause();
      
      await expect(
        transactionLogger.connect(user1).registerUser("testuser")
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause contract", async function () {
      await transactionLogger.pause();
      await transactionLogger.unpause();
      
      await transactionLogger.connect(user1).registerUser("testuser");
      const user = await transactionLogger.getUser(user1.address);
      expect(user.username).to.equal("testuser");
    });
  });

  // TODO: Add more comprehensive tests
  // TODO: Add gas optimization tests
  // TODO: Add edge case tests
  // TODO: Add integration tests with multiple transactions
});
