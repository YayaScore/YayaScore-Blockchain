import { Web3 } from "web3";

// Conecte-se ao Ganache CLI
const web3 = new Web3('http://127.0.0.1:7545');

const listAccountsAndBalances = async () => {
    try {
        const accounts = await web3.eth.getAccounts();
        console.log('Accounts and their balances:');

        for (const account of accounts) {
            const balance = await web3.eth.getBalance(account);
            console.log(`Account: ${account}, Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`);
        }
    } catch (error) {
        console.error('Error fetching accounts or balances:', error);
    }
};

listAccountsAndBalances();
