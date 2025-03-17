// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Ticket.sol";

contract TicketHandler is AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant TICKET_ROLE = keccak256("TICKET_ROLE");

    event TicketMinted(address indexed ticket, address indexed owner, uint256 price, uint256 tokenId);
    event TicketTransferred(address indexed ticket, address indexed from, address indexed to, uint256 tokenId);
    event TicketModified(address indexed ticket, uint256 maxSupply, uint256 price, uint256 maxTokensPerWallet, uint256 publish, bool transferable);
    event TicketUsed(address indexed ticket, uint256 tokenId, bool used);

    constructor(address factory) {
        _grantRole(OWNER_ROLE, msg.sender);
        _grantRole(FACTORY_ROLE, factory);
    }

    function setTicketUsed(Ticket ticket, uint256 tokenId, bool used) external onlyRole(OWNER_ROLE) {
        ticket.setTicketUsed(tokenId, used);
    }

    function grantTicketRole(address ticket) external onlyRole(FACTORY_ROLE) {
        _grantRole(TICKET_ROLE, ticket);
    }

    function ticketMinted(address ticket, address owner, uint256 price, uint256 tokenId) external onlyRole(TICKET_ROLE) {
        emit TicketMinted(ticket, owner, price, tokenId);
    }

    function ticketTransferred(address ticket, address from, address to, uint256 tokenId) external onlyRole(TICKET_ROLE) {
        emit TicketTransferred(ticket, from, to, tokenId);
    }

    function ticketModified(address ticket, uint256 maxSupply, uint256 price, uint256 maxTokensPerWallet, uint256 publish, bool transferable) external onlyRole(TICKET_ROLE) {
        emit TicketModified(ticket, maxSupply, price, maxTokensPerWallet, publish, transferable);
    }

    function ticketUsed(address ticket, uint256 tokenId, bool used) external onlyRole(TICKET_ROLE) {
        emit TicketUsed(ticket, tokenId, used);
    }
}
