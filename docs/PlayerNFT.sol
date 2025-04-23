// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PlayerNFT is ERC721, Ownable {
    uint256 public nextTokenId;
    address public moderator;

    constructor(address _moderator) ERC721("PlayerNFT", "PLNFT") {
        moderator = _moderator;
    }

    modifier onlyModerator() {
        require(msg.sender == moderator, "Not moderator");
        _;
    }

    function mint(address to) external onlyModerator returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        nextTokenId++;
        return tokenId;
    }

    function setModerator(address _moderator) external onlyOwner {
        moderator = _moderator;
    }
}
