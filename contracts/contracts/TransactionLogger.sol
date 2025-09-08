// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TransactionLogger
 * @dev A secure smart contract for logging and tracking transactions on the blockchain
 * @author Ledger Link Team
 */
contract TransactionLogger is Ownable, ReentrancyGuard, Pausable {
    
    // Events
    event TransactionLogged(
        bytes32 indexed transactionId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string metadata,
        uint256 timestamp
    );
    
    event TransactionUpdated(
        bytes32 indexed transactionId,
        uint8 status,
        string reason
    );
    
    event UserRegistered(
        address indexed user,
        string username,
        uint256 timestamp
    );
    
    // Structs
    struct Transaction {
        bytes32 id;
        address from;
        address to;
        uint256 amount;
        uint8 status; // 0: pending, 1: confirmed, 2: failed, 3: cancelled
        string metadata;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    struct User {
        address wallet;
        string username;
        bool isActive;
        uint256 registrationTime;
        uint256 transactionCount;
    }
    
    // State variables
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => User) public users;
    mapping(address => bool) public authorizedLoggers;
    
    uint256 public totalTransactions;
    uint256 public totalUsers;
    
    // Modifiers
    modifier onlyAuthorizedLogger() {
        require(authorizedLoggers[msg.sender] || msg.sender == owner(), "Not authorized to log transactions");
        _;
    }
    
    modifier validAddress(address _address) {
        require(_address != address(0), "Invalid address");
        _;
    }
    
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }
    
    // Constructor
    constructor() {
        // Initialize with deployer as owner
    }
    
    /**
     * @dev Register a new user
     * @param _username The username for the user
     */
    function registerUser(string memory _username) 
        external 
        whenNotPaused 
        validAddress(msg.sender) 
    {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(!users[msg.sender].isActive, "User already registered");
        
        users[msg.sender] = User({
            wallet: msg.sender,
            username: _username,
            isActive: true,
            registrationTime: block.timestamp,
            transactionCount: 0
        });
        
        totalUsers++;
        
        emit UserRegistered(msg.sender, _username, block.timestamp);
    }
    
    /**
     * @dev Log a new transaction
     * @param _from The sender address
     * @param _to The recipient address
     * @param _amount The transaction amount
     * @param _metadata Additional transaction metadata (JSON string)
     * @return transactionId The unique transaction ID
     */
    function logTransaction(
        address _from,
        address _to,
        uint256 _amount,
        string memory _metadata
    ) 
        external 
        onlyAuthorizedLogger 
        whenNotPaused 
        nonReentrant 
        validAddress(_from) 
        validAddress(_to) 
        validAmount(_amount) 
        returns (bytes32) 
    {
        bytes32 transactionId = keccak256(
            abi.encodePacked(
                _from,
                _to,
                _amount,
                block.timestamp,
                block.number,
                totalTransactions
            )
        );
        
        // Ensure transaction ID is unique
        require(transactions[transactionId].timestamp == 0, "Transaction ID collision");
        
        transactions[transactionId] = Transaction({
            id: transactionId,
            from: _from,
            to: _to,
            amount: _amount,
            status: 0, // pending
            metadata: _metadata,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        totalTransactions++;
        
        // Update user transaction count
        if (users[_from].isActive) {
            users[_from].transactionCount++;
        }
        
        emit TransactionLogged(
            transactionId,
            _from,
            _to,
            _amount,
            _metadata,
            block.timestamp
        );
        
        return transactionId;
    }
    
    /**
     * @dev Update transaction status
     * @param _transactionId The transaction ID to update
     * @param _status The new status (0: pending, 1: confirmed, 2: failed, 3: cancelled)
     * @param _reason Optional reason for status change
     */
    function updateTransactionStatus(
        bytes32 _transactionId,
        uint8 _status,
        string memory _reason
    ) 
        external 
        onlyAuthorizedLogger 
        whenNotPaused 
    {
        require(transactions[_transactionId].timestamp != 0, "Transaction not found");
        require(_status <= 3, "Invalid status");
        
        transactions[_transactionId].status = _status;
        
        emit TransactionUpdated(_transactionId, _status, _reason);
    }
    
    /**
     * @dev Get transaction details
     * @param _transactionId The transaction ID
     * @return Transaction struct
     */
    function getTransaction(bytes32 _transactionId) 
        external 
        view 
        returns (Transaction memory) 
    {
        require(transactions[_transactionId].timestamp != 0, "Transaction not found");
        return transactions[_transactionId];
    }
    
    /**
     * @dev Get user details
     * @param _user The user address
     * @return User struct
     */
    function getUser(address _user) 
        external 
        view 
        returns (User memory) 
    {
        require(users[_user].isActive, "User not found");
        return users[_user];
    }
    
    /**
     * @dev Check if user is registered
     * @param _user The user address
     * @return bool True if user is registered and active
     */
    function isUserRegistered(address _user) external view returns (bool) {
        return users[_user].isActive;
    }
    
    /**
     * @dev Get transaction count for a user
     * @param _user The user address
     * @return uint256 Number of transactions
     */
    function getUserTransactionCount(address _user) external view returns (uint256) {
        return users[_user].transactionCount;
    }
    
    /**
     * @dev Add authorized logger (only owner)
     * @param _logger The address to authorize
     */
    function addAuthorizedLogger(address _logger) 
        external 
        onlyOwner 
        validAddress(_logger) 
    {
        authorizedLoggers[_logger] = true;
    }
    
    /**
     * @dev Remove authorized logger (only owner)
     * @param _logger The address to remove authorization from
     */
    function removeAuthorizedLogger(address _logger) 
        external 
        onlyOwner 
        validAddress(_logger) 
    {
        authorizedLoggers[_logger] = false;
    }
    
    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract statistics
     * @return totalTransactions Total number of transactions
     * @return totalUsers Total number of users
     * @return contractBalance Current contract balance
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256,
            uint256,
            uint256
        ) 
    {
        return (totalTransactions, totalUsers, address(this).balance);
    }
    
    // TODO: Add batch transaction logging
    // TODO: Add transaction filtering and search
    // TODO: Add event indexing for better querying
    // TODO: Add upgrade mechanism for contract updates
    // TODO: Add multi-signature support for critical operations
}
