// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BotPayment
 * @dev Smart contract to manage automatic payments from AI bots to the moderator
 */
contract BotPayment {
    // Moderator address that receives payments
    address public moderator;
    
    // Mapping to track bot payments
    mapping(address => uint256) public botPayments;
    
    // Total amount received from bots
    uint256 public totalPaymentsReceived;
    
    // Events
    event PaymentSent(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event ModeratorUpdated(address indexed oldModerator, address indexed newModerator);
    event WithdrawalMade(address indexed to, uint256 amount);
    
    // Modifiers
    modifier onlyModerator() {
        require(msg.sender == moderator, "BotPayment: caller is not the moderator");
        _;
    }
    
    /**
     * @dev Constructor sets the moderator address
     * @param _moderator Address of the moderator who will receive payments
     */
    constructor(address _moderator) {
        require(_moderator != address(0), "BotPayment: invalid moderator address");
        moderator = _moderator;
    }
    
    /**
     * @dev Function to pay the moderator directly
     * @return success True if payment is successful
     */
    function payModerator() external payable returns (bool) {
        require(msg.value > 0, "BotPayment: payment amount must be greater than zero");
        
        botPayments[msg.sender] += msg.value;
        totalPaymentsReceived += msg.value;
        
        emit PaymentSent(msg.sender, moderator, msg.value, block.timestamp);
        return true;
    }
    
    /**
     * @dev Transfer the entire contract balance to the moderator
     * @return success True if transfer is successful
     */
    function transferToModerator() external onlyModerator returns (bool) {
        uint256 balance = address(this).balance;
        require(balance > 0, "BotPayment: contract has no balance to transfer");
        
        (bool success, ) = payable(moderator).call{value: balance}("");
        require(success, "BotPayment: transfer to moderator failed");
        
        emit WithdrawalMade(moderator, balance);
        return true;
    }
    
    /**
     * @dev Update the moderator address
     * @param _newModerator Address of the new moderator
     * @return success True if update is successful
     */
    function updateModerator(address _newModerator) external onlyModerator returns (bool) {
        require(_newModerator != address(0), "BotPayment: invalid moderator address");
        
        address oldModerator = moderator;
        moderator = _newModerator;
        
        emit ModeratorUpdated(oldModerator, _newModerator);
        return true;
    }
    
    /**
     * @dev Get the balance of a specific bot
     * @param bot Address of the bot
     * @return amount Total amount paid by the bot
     */
    function getBotPayments(address bot) external view returns (uint256) {
        return botPayments[bot];
    }
    
    /**
     * @dev Get contract balance
     * @return amount Current contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Receive function to accept direct payments
     */
    receive() external payable {
        botPayments[msg.sender] += msg.value;
        totalPaymentsReceived += msg.value;
        
        emit PaymentSent(msg.sender, moderator, msg.value, block.timestamp);
    }
}