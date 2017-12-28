var ChainDoctorHub = artifacts.require("./ChainDoctorHub.sol");

module.exports = function(deployer) {
  deployer.deploy(ChainDoctorHub);
};
