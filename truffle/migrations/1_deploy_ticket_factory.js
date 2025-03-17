const TicketFactory = artifacts.require('TicketFactory');

module.exports = function (deployer) {
  deployer.deploy(TicketFactory);
};
