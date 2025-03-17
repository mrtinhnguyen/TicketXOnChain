// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./TicketHandler.sol";

contract Ticket is ERC721Enumerable, Pausable, AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant USHER_ROLE = keccak256("USHER_ROLE");

    uint256 public maxSupply;
    uint256 public price;
    uint256 public maxTokensPerWallet;
    uint256 public publish;
    bool public transferable;
    string internal baseURI;
    TicketHandler internal handler;

     // Mapping from token ID to usage flag
    mapping(uint256 => bool) internal ticketUsed;

    constructor(
        string memory name,
        string memory symbol,
        address owner,
        uint256 _maxSupply,
        uint256 _price,
        uint256 _maxTokensPerWallet,
        string memory baseURI_,
        TicketHandler _handler,
        uint256 _publish,
        bool _transferable
    )
        ERC721(name, symbol)
    {
        maxSupply = _maxSupply;
        price = _price;
        maxTokensPerWallet = _maxTokensPerWallet;
        baseURI = baseURI_;
        handler = _handler;
        publish = _publish;
        transferable = _transferable;
        _grantRole(OWNER_ROLE, owner);
        _grantRole(USHER_ROLE, owner);
        _grantRole(USHER_ROLE, address(handler));
    }

    function safeMint(address to) external payable returns (uint256 tokenId) {
        require(totalSupply() < maxSupply, "Purchase would exceed max supply of tokens");
        require(balanceOf(to) < maxTokensPerWallet, "Purchase would exceed max tokens per wallet");
        require(block.timestamp >= publish, "Minting is not active yet");
        require(price == msg.value, "Ether value sent is incorrect");

        tokenId = totalSupply();
        _safeMint(to, tokenId);
        handler.ticketMinted(address(this), to, price, tokenId);
    }

    function multiSafeMint(address to, uint256 quantity) external payable returns (uint256[] memory) {
        require(quantity > 0, "Quantity has to be greater than 0");
        require(totalSupply() + quantity <= maxSupply, "Purchase would exceed max supply of tokens");
        require(balanceOf(to) + quantity <= maxTokensPerWallet, "Purchase would exceed max tokens per wallet");
        require(block.timestamp >= publish, "Minting is not active yet");
        require(price * quantity == msg.value, "Ether value sent is incorrect");

        uint256[] memory tokensIds = new uint256[](quantity);
        for (uint256 i = 0; i < quantity ; i++) {
            uint256 tokenId = totalSupply();
            _safeMint(to, tokenId);
            handler.ticketMinted(address(this), to, price, tokenId);
            tokensIds[i] = tokenId;
        }

        return tokensIds;
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        require(transferable == true, "Token is not transferable");

        super.transferFrom(from, to, tokenId);
        handler.ticketTransferred(address(this), from, to, tokenId);
    }

    function modifyTicket(uint256 _maxSupply, uint256 _price, uint256 _maxTokensPerWallet, uint256 _publish, bool _transferable) external onlyRole(OWNER_ROLE) {
        maxSupply = _maxSupply;
        price = _price;
        maxTokensPerWallet = _maxTokensPerWallet;
        publish = _publish;
        transferable = _transferable;
        handler.ticketModified(address(this), maxSupply, price, maxTokensPerWallet, publish, transferable);
    }

    function setTicketUsed(uint256 tokenId, bool used) external onlyRole(USHER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        ticketUsed[tokenId] = used;
        handler.ticketUsed(address(this), tokenId, used);
    }

    function isTicketUsed(uint256 tokenId) public view returns (bool) {
        return ticketUsed[tokenId];
    }

    function pause() external onlyRole(OWNER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(OWNER_ROLE) {
        _unpause();
    }

    function transferFunds(address payable to, uint amount) external onlyRole(OWNER_ROLE) {
        (bool success, ) = to.call{ value: amount }("");
        require(success, "Failed to send Ether");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}
