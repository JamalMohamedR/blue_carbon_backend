// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract BlueCarbonRegistry is ERC721, AccessControl {
    uint256 private _tokenIdCounter;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Credit {
        string projectId;
        string location; // lat-long or geoID
        string verificationId; // MRV team's verification ID
        uint256 issuedAt;
        bool retired;
    }

    // tokenId -> Credit
    mapping(uint256 => Credit) public credits;

    // unique key -> used?
    mapping(bytes32 => bool) private _verificationUsed;

    event CreditIssued(
        uint256 indexed tokenId,
        address indexed to,
        string projectId,
        string location,
        string verificationId
    );

    event CreditRetired(uint256 indexed tokenId, address indexed retiredBy);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        // Deployer has both admin and issuer role by default.
    }

    /**
     * @notice Issue a single 1 tCO2e credit as an ERC721 token.
     * @dev Reverts if same (projectId, location, verificationId) has been used.
     */
    function issueCredit(
        address to,
        string memory projectId,
        string memory location,
        string memory verificationId
    ) public onlyRole(ISSUER_ROLE) returns (uint256) {
        bytes32 key = keccak256(abi.encodePacked(projectId, location, verificationId));
        require(!_verificationUsed[key], "Verification already used");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        credits[tokenId] = Credit({
            projectId: projectId,
            location: location,
            verificationId: verificationId,
            issuedAt: block.timestamp,
            retired: false
        });

        _verificationUsed[key] = true;

        emit CreditIssued(tokenId, to, projectId, location, verificationId);

        return tokenId;
    }

    /**
     * @notice Mark a token as retired. Owner or admin may retire.
     * Retired tokens cannot be transferred afterwards.
     */
    function retire(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        address owner = ownerOf(tokenId);
        require(msg.sender == owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not owner or admin");
        require(!credits[tokenId].retired, "Already retired");

        credits[tokenId].retired = true;

        emit CreditRetired(tokenId, msg.sender);
    }

    /**
     * @notice View helper to check whether a given (projectId, location, verificationId) was used
     */
    function isVerificationUsed(string memory projectId, string memory location, string memory verificationId) public view returns (bool) {
        bytes32 key = keccak256(abi.encodePacked(projectId, location, verificationId));
        return _verificationUsed[key];
    }

    /**
     * @dev Prevent transfers of retired tokens (but allow minting and burning).
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        
        // Prevent transfer of retired tokens (except minting and burning)
        if (from != address(0) && to != address(0)) {
            require(!credits[firstTokenId].retired, "Cannot transfer retired token");
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}