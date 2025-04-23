// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IPLNFT is ERC721URIStorage, Ownable {

    uint256 public tokenCounter;
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC721("IPL Player NFT", "IPLNFT") {
        tokenCounter = 0;
    }

    // Mint a new NFT
    function mint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        tokenCounter++;
        return tokenId;
    }

    // Set the token URI (metadata URL)
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        _tokenURIs[tokenId] = tokenURI;
    }

    // Override tokenURI function to return the custom token URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
}
