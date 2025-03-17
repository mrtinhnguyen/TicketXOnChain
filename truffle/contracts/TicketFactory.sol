// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TicketHandler.sol";
import "./Ticket.sol";

contract TicketFactory is Ownable {
    Ticket[] internal tickets;

    event TicketCreated(int32 idEvent, Ticket ticket);

    constructor() Ownable(msg.sender) {}

    function createTicket(
        int32 idEvent,
        string memory name,
        string memory symbol,
        address owner,
        uint256 maxSupply,
        uint256 price,
        uint256 maxTokensPerWallet,
        string memory baseURI,
        TicketHandler handler,
        uint256 publish,
        bool transferable
    ) external onlyOwner {
        Ticket ticket = new Ticket(name, symbol, owner, maxSupply, price, maxTokensPerWallet, baseURI, handler, publish, transferable);
        tickets.push(ticket);
        handler.grantTicketRole(address(ticket));
        emit TicketCreated(idEvent, ticket);
    }

    function getTickets() external view returns (Ticket[] memory) {
        return tickets;
    }
}
