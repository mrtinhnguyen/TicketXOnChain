const TicketFactory = artifacts.require('TicketFactory');
const TicketHandler = artifacts.require('TicketHandler');

contract('TicketFactory', function (accounts) {
  it('smart contract deployed', async function () {
    await TicketFactory.deployed();

    return assert.isTrue(true);
  });

  it('create ticket', async function () {
    const ticketFactory = await TicketFactory.deployed();
    const ticketHandler = await TicketHandler.deployed();

    const res = await ticketFactory.createTicket(
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

    console.log(res.logs);

    return assert.isTrue(true);
  });

  it('list tickets', async function () {
    const ticketFactory = await TicketFactory.deployed();

    const tickets = await ticketFactory.getTickets();

    console.log(tickets);

    return assert.isTrue(tickets.length === 1);
  });
});
