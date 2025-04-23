// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPlayerNFT {
    function mint(address to) external returns (uint256);
}

contract PlayerAuction is Ownable {
    struct Auction {
        address player;
        uint256 endTime;
        uint256 highestBid;
        address highestBidder;
        bool finalized;
    }

    address public moderatorWallet;
    address public playerNFT;
    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;

    event AuctionCreated(uint256 indexed auctionId, address indexed player, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionFinalized(uint256 indexed auctionId, address indexed winner, uint256 amount);

    constructor(address _moderatorWallet, address _playerNFT) {
        moderatorWallet = _moderatorWallet;
        playerNFT = _playerNFT;
    }

    function createAuction(address player, uint256 duration) external onlyOwner returns (uint256) {
        auctionCount++;
        auctions[auctionCount] = Auction({
            player: player,
            endTime: block.timestamp + duration,
            highestBid: 0,
            highestBidder: address(0),
            finalized: false
        });
        emit AuctionCreated(auctionCount, player, block.timestamp + duration);
        return auctionCount;
    }

    function bid(uint256 auctionId) external payable {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function finalizeAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.finalized, "Already finalized");
        auction.finalized = true;
        if (auction.highestBidder != address(0)) {
            payable(moderatorWallet).transfer(auction.highestBid);
            IPlayerNFT(playerNFT).mint(auction.highestBidder);
        }
        emit AuctionFinalized(auctionId, auction.highestBidder, auction.highestBid);
    }
}
