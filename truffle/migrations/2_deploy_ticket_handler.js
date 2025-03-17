const TicketFactory = artifacts.require('TicketFactory');
const TicketHandler = artifacts.require('TicketHandler');

module.exports = function (deployer) {
  deployer.deploy(TicketHandler, TicketFactory.address);
};
