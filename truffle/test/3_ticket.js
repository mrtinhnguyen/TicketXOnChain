const Ticket = artifacts.require('Ticket');
const TicketFactory = artifacts.require('TicketFactory');
const TicketHandler = artifacts.require('TicketHandler');

contract('Ticket', function (accounts) {
  let ticket;

  beforeEach(async function () {
    const ticketFactory = await TicketFactory.deployed();
    const ticketHandler = await TicketHandler.deployed();

    await ticketFactory.createTicket(
      0,
      'Test event',
      'TESTEVENT',
      accounts[0],
      100,
      0n,
      2,
      '/',
      ticketHandler.address,
      Math.floor(new Date().getTime() / 1000),
      false
    );

    const tickets = await ticketFactory.getTickets();

    ticket = await Ticket.at(tickets[tickets.length - 1]);
  });

  it('smart contract deployed', async function () {
    const name = await ticket.name();

    console.log(name);

    return assert.isTrue(true);
  });

  it('modify ticket', async function () {
    const expectedArgs = [
      250,
      1000000000000000n,
      5,
      Math.floor(new Date().getTime() / 1000),
      false,
    ];
    await ticket.modifyTicket(...expectedArgs);

    const maxSupply = await ticket.maxSupply();
    const price = await ticket.price();
    const maxTokensPerWallet = await ticket.maxTokensPerWallet();
    const publish = await ticket.publish();
    const transferable = await ticket.transferable();

    const args = [
      Number(maxSupply),
      BigInt(price),
      Number(maxTokensPerWallet),
      Number(publish),
      transferable,
    ];

    return assert.deepEqual(args, expectedArgs);
  });

  it('multi safe mint', async function () {
    const res = await ticket.multiSafeMint(accounts[0], 2);

    console.log(res.logs);

    const balance = await ticket.balanceOf(accounts[0]);

    return assert.equal(balance, 2);
  });

  it('set ticket used', async function () {
    await ticket.safeMint(accounts[0]);

    const tokenId = await ticket.tokenOfOwnerByIndex(accounts[0], 0);

    const res = await ticket.setTicketUsed(tokenId, true);

    console.log(res.logs);

    const ticketUsed = await ticket.isTicketUsed(tokenId);

    return assert.isTrue(ticketUsed);
  });

  it('pause', async function () {
    await ticket.pause();

    return assert.isTrue(true);
  });
});
