// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title AutoBidder
 * @dev Smart contract that enables AI bots to automatically place bids in the auction system
 * without requiring user interaction
 */
contract AutoBidder {
    address public owner;
    address public auctionContract;
    
    // Bidder configuration
    struct BidderConfig {
        address bidderAddress;
        string name;
        bool isActive;
        uint256 maxBidAmount;
        uint256 bidIncrement; // in basis points (1/100 of a percent)
        uint256 bidProbability; // 0-100
        string strategy; // "aggressive", "conservative", "balanced"
    }
    
    // Maps bot identifiers to their configurations
    mapping(bytes32 => BidderConfig) public bidders;
    bytes32[] public bidderIds;
    
    // Events
    event BidderRegistered(bytes32 indexed bidderId, address bidderAddress, string name);
    event BidderActivated(bytes32 indexed bidderId);
    event BidderDeactivated(bytes32 indexed bidderId);
    event AutoBidPlaced(bytes32 indexed bidderId, uint256 auctionId, uint256 amount);
    event ContractFunded(address funder, uint256 amount);
    event FundsWithdrawn(address recipient, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _auctionContract Address of the auction contract
     */
    constructor(address _auctionContract) {
        owner = msg.sender;
        auctionContract = _auctionContract;
    }
    
    /**
     * @dev Allow contract to receive funds
     */
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Register a new AI bot bidder
     * @param _name Name of the AI bot
     * @param _bidderAddress Address to use for the bot
     * @param _maxBidAmount Maximum amount the bot can bid
     * @param _bidIncrement Bot's bid increment in basis points
     * @param _bidProbability Probability of the bot bidding (0-100)
     * @param _strategy Bidding strategy of the bot
     * @return bidderId Unique identifier for this bidder
     */
    function registerBidder(
        string memory _name,
        address _bidderAddress,
        uint256 _maxBidAmount,
        uint256 _bidIncrement,
        uint256 _bidProbability,
        string memory _strategy
    ) public onlyOwner returns (bytes32) {
        require(_bidProbability <= 100, "Probability must be between 0 and 100");
        
        bytes32 bidderId = keccak256(abi.encodePacked(_bidderAddress, _name));
        
        bidders[bidderId] = BidderConfig({
            bidderAddress: _bidderAddress,
            name: _name,
            isActive: true,
            maxBidAmount: _maxBidAmount,
            bidIncrement: _bidIncrement,
            bidProbability: _bidProbability,
            strategy: _strategy
        });
        
        bidderIds.push(bidderId);
        
        emit BidderRegistered(bidderId, _bidderAddress, _name);
        return bidderId;
    }
    
    /**
     * @dev Activate a bidder
     * @param _bidderId Identifier of the bidder to activate
     */
    function activateBidder(bytes32 _bidderId) public onlyOwner {
        require(bidders[_bidderId].bidderAddress != address(0), "Bidder does not exist");
        bidders[_bidderId].isActive = true;
        emit BidderActivated(_bidderId);
    }
    
    /**
     * @dev Deactivate a bidder
     * @param _bidderId Identifier of the bidder to deactivate
     */
    function deactivateBidder(bytes32 _bidderId) public onlyOwner {
        require(bidders[_bidderId].bidderAddress != address(0), "Bidder does not exist");
        bidders[_bidderId].isActive = false;
        emit BidderDeactivated(_bidderId);
    }
    
    /**
     * @dev Get all registered bidder IDs
     * @return Array of bidder IDs
     */
    function getAllBidderIds() public view returns (bytes32[] memory) {
        return bidderIds;
    }
    
    /**
     * @dev Get bidder configuration by ID
     * @param _bidderId Identifier of the bidder
     * @return The bidder configuration
     */
    function getBidderConfig(bytes32 _bidderId) public view returns (BidderConfig memory) {
        return bidders[_bidderId];
    }
    
    /**
     * @dev Automatically place a bid on behalf of an AI bot
     * @param _bidderId Identifier of the bidder
     * @param _auctionId ID of the auction to bid on
     * @param _currentBid Current highest bid in the auction
     * @return success True if bid was placed, false otherwise
     * @return bidAmount The amount of the bid
     */
    function placeBotBid(
        bytes32 _bidderId, 
        uint256 _auctionId, 
        uint256 _currentBid
    ) public returns (bool success, uint256 bidAmount) {
        BidderConfig memory bidder = bidders[_bidderId];
        
        // Check if bidder exists and is active
        require(bidder.bidderAddress != address(0), "Bidder does not exist");
        require(bidder.isActive, "Bidder is not active");
        
        // Determine if bot should bid based on probability
        uint256 randomValue = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, _auctionId))) % 100;
        if (randomValue >= bidder.bidProbability) {
            return (false, 0); // Bot decides not to bid
        }
        
        // Calculate bid amount based on bidding strategy
        bidAmount = calculateBidAmount(bidder, _currentBid);
        
        // Check if bidAmount exceeds bot's max bid limit
        if (bidAmount > bidder.maxBidAmount) {
            return (false, 0);
        }
        
        // Check contract balance
        require(address(this).balance >= bidAmount, "Insufficient contract balance");
        
        // Call the auction contract to place the bid
        (bool sent, ) = auctionContract.call{value: bidAmount}(
            abi.encodeWithSignature("placeBid(uint256)", _auctionId)
        );
        
        if (sent) {
            emit AutoBidPlaced(_bidderId, _auctionId, bidAmount);
            return (true, bidAmount);
        } else {
            return (false, 0);
        }
    }
    
    /**
     * @dev Calculate bid amount based on bidding strategy
     * @param bidder The bidder configuration
     * @param currentBid Current highest bid in the auction
     * @return The calculated bid amount
     */
    function calculateBidAmount(
        BidderConfig memory bidder,
        uint256 currentBid
    ) internal view returns (uint256) {
        uint256 increment = bidder.bidIncrement;
        
        // Adjust increment based on strategy
        if (keccak256(abi.encodePacked(bidder.strategy)) == keccak256(abi.encodePacked("aggressive"))) {
            increment = increment + 200; // Add 2% for aggressive
        } else if (keccak256(abi.encodePacked(bidder.strategy)) == keccak256(abi.encodePacked("conservative"))) {
            increment = increment - 100; // Subtract 1% for conservative
        }
        
        // Ensure minimum increment
        increment = increment < 50 ? 50 : increment; // Minimum 0.5%
        
        // Calculate bid amount (currentBid + increment%)
        uint256 bidAmount = currentBid + ((currentBid * increment) / 10000);
        
        // Add some randomness to make bids less predictable
        uint256 randomness = uint256(keccak256(abi.encodePacked(block.timestamp, bidder.bidderAddress))) % 100;
        bidAmount += (currentBid * randomness) / 100000; // Adds 0-0.1% randomness
        
        return bidAmount;
    }
    
    /**
     * @dev Set the auction contract address
     * @param _auctionContract New auction contract address
     */
    function setAuctionContract(address _auctionContract) public onlyOwner {
        require(_auctionContract != address(0), "Invalid auction contract address");
        auctionContract = _auctionContract;
    }
    
    /**
     * @dev Withdraw funds from the contract
     * @param _amount Amount to withdraw
     */
    function withdraw(uint256 _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient contract balance");
        payable(owner).transfer(_amount);
        emit FundsWithdrawn(owner, _amount);
    }
    
    /**
     * @dev Withdraw all funds from the contract
     */
    function withdrawAll() public onlyOwner {
        uint256 amount = address(this).balance;
        payable(owner).transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }
    
    /**
     * @dev Update bidder configuration
     * @param _bidderId Identifier of the bidder to update
     * @param _maxBidAmount New maximum bid amount
     * @param _bidIncrement New bid increment
     * @param _bidProbability New bid probability
     * @param _strategy New bidding strategy
     */
    function updateBidderConfig(
        bytes32 _bidderId,
        uint256 _maxBidAmount,
        uint256 _bidIncrement,
        uint256 _bidProbability,
        string memory _strategy
    ) public onlyOwner {
        require(bidders[_bidderId].bidderAddress != address(0), "Bidder does not exist");
        require(_bidProbability <= 100, "Probability must be between 0 and 100");
        
        BidderConfig storage bidder = bidders[_bidderId];
        bidder.maxBidAmount = _maxBidAmount;
        bidder.bidIncrement = _bidIncrement;
        bidder.bidProbability = _bidProbability;
        bidder.strategy = _strategy;
    }
}