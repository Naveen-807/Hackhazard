// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IPLPlayerCard
 * @dev ERC721 contract for IPL player cards, compatible with Monad testnet
 */
contract IPLPlayerCard is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Mapping for player info (tokenId => PlayerInfo)
    struct PlayerInfo {
        string name;
        string description;
        string role;           // Batsman, Bowler, All-rounder, Wicket-keeper
        string nationality;
        uint256 age;
        string previousTeam;
        string rarity;         // Common, Rare, Epic, Legendary
        uint256 matches;
        uint256 runs;
        uint256 battingAverage;
        uint256 strikeRate;
        string specialty;
        string externalUrl;
    }
    
    // Player info mapping
    mapping(uint256 => PlayerInfo) private _playerInfo;
    
    // Events
    event PlayerCardMinted(uint256 indexed tokenId, string name, address owner);
    
    constructor() ERC721("IPL Player Card", "IPLPC") {
        // Constructor logic
    }
    
    /**
     * @dev Mints a new IPL player card NFT
     * @param to The address that will own the minted NFT
     * @param tokenURI IPFS URI to the player metadata
     * @return tokenId The ID of the newly minted NFT
     */
    function mintPlayerCard(
        address to, 
        string memory tokenURI,
        string memory name,
        string memory description,
        string memory role,
        string memory nationality,
        uint256 age,
        string memory previousTeam,
        string memory rarity,
        uint256 matches,
        uint256 runs,
        uint256 battingAverage,
        uint256 strikeRate,
        string memory specialty,
        string memory externalUrl
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Store player information
        _playerInfo[tokenId] = PlayerInfo({
            name: name,
            description: description,
            role: role,
            nationality: nationality,
            age: age,
            previousTeam: previousTeam,
            rarity: rarity,
            matches: matches,
            runs: runs,
            battingAverage: battingAverage,
            strikeRate: strikeRate,
            specialty: specialty,
            externalUrl: externalUrl
        });
        
        _tokenIdCounter.increment();
        
        emit PlayerCardMinted(tokenId, name, to);
        
        return tokenId;
    }
    
    /**
     * @dev Returns player info for a specific token ID
     * @param tokenId The ID of the NFT
     * @return PlayerInfo structure containing player details
     */
    function getPlayerInfo(uint256 tokenId) public view returns (PlayerInfo memory) {
        require(_exists(tokenId), "IPLPlayerCard: Query for nonexistent token");
        return _playerInfo[tokenId];
    }
    
    /**
     * @dev Returns base URI for the collection
     * Can be overridden for custom base URI for IPFS gateway
     */
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }
    
    /**
     * @dev Required override for ERC721 transfer restrictions (none for this contract)
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @dev Function for batch minting player cards from existing metadata
     * @param to The address that will own the minted NFTs
     * @param tokenURIs Array of IPFS URIs to the player metadata
     * @return Array of minted token IDs
     */
    function batchMintPlayerCards(address to, string[] memory tokenURIs) public onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            tokenIds[i] = _tokenIdCounter.current();
            _safeMint(to, tokenIds[i]);
            _setTokenURI(tokenIds[i], tokenURIs[i]);
            _tokenIdCounter.increment();
            
            // Note: This function doesn't store PlayerInfo for batch mints
            // The data should be retrieved from the tokenURI
        }
        
        return tokenIds;
    }
}