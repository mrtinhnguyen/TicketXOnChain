const TicketHandler = artifacts.require('TicketHandler');

contract('TicketHandler', function () {
  it('smart contract deployed', async function () {
    await TicketHandler.deployed();

    return assert.isTrue(true);
  });
});
