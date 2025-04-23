// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPLPlayerCard
 * @dev Gas-optimized ERC721 contract for IPL player cards
 */
contract IPLPlayerCard is ERC721, Ownable {
    // Token ID counter - using uint96 to save gas since we won't need larger values
    uint96 private _tokenIdCounter;
    
    // Mapping from token ID to URI
    mapping(uint256 => string) private _tokenURIs;
    
    // Player info structure
    struct PlayerInfo {
        string name;
        string description;
        string role;           // Batsman, Bowler, All-rounder, Wicket-keeper
        string nationality;
        uint16 age;            // Reduced from uint256 to uint16 to save gas
        string previousTeam;
        string rarity;         // Common, Rare, Epic, Legendary
        uint16 matches;        // Reduced from uint256 to uint16
        uint32 runs;           // Reduced from uint256 to uint32
        uint16 battingAverage; // Reduced from uint256 to uint16
        uint16 strikeRate;     // Reduced from uint256 to uint16
        string specialty;
        string externalUrl;
    }
    
    // Player info mapping
    mapping(uint256 => PlayerInfo) private _playerInfo;
    
    // Events
    event PlayerCardMinted(uint256 indexed tokenId, string name, address owner);
    
    constructor() ERC721("IPL Player Card", "IPLPC") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }
    
    /**
     * @dev Set token URI - separate function to save gas when batch minting
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    /**
     * @dev Get token URI - required for metadata support
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "IPLPlayerCard: URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        
        // If both are set, concatenate the baseURI and tokenURI
        if (bytes(base).length > 0 && bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        
        return _tokenURI;
    }
    
    /**
     * @dev Mints a new IPL player card NFT using struct to avoid stack too deep errors
     * @param to The address that will own the minted NFT
     * @param tokenURI IPFS URI to the player metadata
     * @param playerData The struct containing all player information
     * @return tokenId The ID of the newly minted NFT
     */
    function mintPlayerCard(
        address to, 
        string calldata tokenURI,  // Changed to calldata to save gas
        PlayerInfo calldata playerData  // Changed to calldata to save gas
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _mint(to, tokenId);  // Using _mint instead of _safeMint to save gas
        _setTokenURI(tokenId, tokenURI);
        
        // Store player information
        _playerInfo[tokenId] = playerData;
        
        unchecked { _tokenIdCounter++; }  // Using unchecked to save gas
        
        emit PlayerCardMinted(tokenId, playerData.name, to);
        
        return tokenId;
    }
    
    /**
     * @dev Returns player info for a specific token ID
     * @param tokenId The ID of the NFT
     * @return PlayerInfo structure containing player details
     */
    function getPlayerInfo(uint256 tokenId) public view returns (PlayerInfo memory) {
        require(_ownerOf(tokenId) != address(0), "IPLPlayerCard: Query for nonexistent token");
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
     * @dev Function for batch minting player cards from existing metadata
     * @param to The address that will own the minted NFTs
     * @param tokenURIs Array of IPFS URIs to the player metadata
     * @return Array of minted token IDs
     */
    function batchMintPlayerCards(address to, string[] calldata tokenURIs) public onlyOwner returns (uint256[] memory) {
        uint256 length = tokenURIs.length;
        uint256[] memory tokenIds = new uint256[](length);
        uint256 tokenId;
        
        for (uint256 i = 0; i < length; i++) {
            tokenId = _tokenIdCounter;
            tokenIds[i] = tokenId;
            _mint(to, tokenId);  // Using _mint instead of _safeMint to save gas
            _setTokenURI(tokenId, tokenURIs[i]);
            
            unchecked { _tokenIdCounter++; }  // Using unchecked to save gas
        }
        
        return tokenIds;
    }
}