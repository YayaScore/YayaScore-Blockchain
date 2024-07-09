const fs = require("fs");
const { Web3 } = require("web3");
const web3 = new Web3("http://127.0.0.1:7545");

const contractABI = JSON.parse(fs.readFileSync("../outputs/EtherAuction.abi"));
const contractByteCode = "0x" + fs.readFileSync("../outputs/EtherAuction.bin", "utf8").trim();

const deployContract = async () => {
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    const EtherAuction = new web3.eth.Contract(contractABI);

    const deployedContract = await EtherAuction.deploy({
        data: contractByteCode,
    }).send({
        from: deployer,
        gas: 3000000,
        gasPrice: "30000000000000",
    });

    return deployedContract;
};

const interactWithContract = async (contract) => {
    console.log("Entered here");
    const accounts = await web3.eth.getAccounts();
    const seller = accounts[0];
    const bidder1 = accounts[1];
    const bidder2 = accounts[2];

    await contract.methods.start(web.utils("1", "ether")).send({ from: seller });
    console.log("Auction started");

    await contract.methods.bid().send({ from: bidder1, value: web3.utils("2", "ether") });
    console.log("Bid placed by bidder1");

    await contract.methods.bid().send({ from: bidder2, value: web3.utils("3", "ether") });
    console.log("Bid placed by bidder2");

    await contract.methods.end().send({ from: seller });
    console.log("Auction ended");
};


const main = async () => {
    const contract = await deployContract();
};

main();
