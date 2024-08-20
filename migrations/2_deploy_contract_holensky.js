const Score = artifacts.require("Score");
module.exports = function(deployer, network, accounts) {

  const initialFunding = web3.utils.toWei('0.5', 'ether');

  deployer.deploy(Score, { from: accounts[0], value: initialFunding });
};
