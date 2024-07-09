const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Conecte ao Ganache
const web3 = new Web3('http://127.0.0.1:7545');

// Leia o ABI e bytecode do contrato
const abiPath = path.resolve(__dirname, '../outputs/Score.abi');
const binPath = path.resolve(__dirname, '../outputs/Score.bin');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const bytecode = '0x' + fs.readFileSync(binPath, 'utf8');

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    const initialFunding = web3.utils.toWei('99', 'ether');

    console.log('Tentando fazer o deploy a partir da conta', accounts[0]);

    // Crie e faça o deploy do contrato
    const result = await new web3.eth.Contract(abi)
        .deploy({ data: bytecode, arguments: [] }) // Substitua '0' pelos argumentos do construtor, se necessário
        .send({ from: accounts[0], value: initialFunding, gas: '3000000' });

    console.log('Contrato deployado em', result.options.address);
};

deploy();

