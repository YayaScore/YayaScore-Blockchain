import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import readlineSync from 'readline-sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Verificação de parâmetros da linha de comando
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Forneça o endereço do contrato como argumento");
    process.exit(1);
}

// Configuração para obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração da conexão com o nó Ethereum
const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545'); // Altere para o seu nó Ethereum

// Endereço do contrato implantado
const contractAddress = args[0];

// Leitura do ABI do contrato
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../build/contracts/Score.json'), 'utf8')).abi;

// Criação da instância do contrato
const contract = new web3.eth.Contract(contractABI, contractAddress);

let userAddress = '';

// Função genérica para estimar e enviar transações
async function sendTransaction(method, options = {}) {
    const gas = await method.estimateGas(options);
    return method.send({ ...options, gas });
}

// Função para obter detalhes de um pedido de empréstimo
async function getLoanRequestDetails(requestId) {
    try {
        const details = await contract.methods.getLoanRequestDetails(requestId).call();
        console.log('Detalhes do Pedido de Empréstimo:', details);
    } catch (error) {
        console.error('Erro ao obter detalhes do pedido de empréstimo:', error);
    }
}

// Função para solicitar um empréstimo
async function requestLoan(amount, minInterestRate) {
    try {
        await sendTransaction(contract.methods.requestLoan(amount, minInterestRate), { from: userAddress });
        console.log('Empréstimo solicitado com sucesso.');
    } catch (error) {
        console.error('Erro ao solicitar empréstimo:', error);
    }
}

// Função para oferecer um empréstimo com interface amigável
async function offerLoan(requestId, interestRate, amount) {
    try {
        const details = await contract.methods.getLoanRequestDetails(requestId).call();
        displayLoanDetails(details);
        await sendTransaction(contract.methods.offerLoan(requestId, interestRate), { from: userAddress, value: amount });
        console.log('Oferta de empréstimo feita com sucesso.');
    } catch (error) {
        console.error('Erro ao oferecer empréstimo:', error);
    }
}

// Função para exibir detalhes do pedido de empréstimo
function displayLoanDetails(details) {
    console.log(`
        Detalhes do Pedido de Empréstimo:
        - Tomador: ${details.borrower}
        - Valor: ${details.amountBRL} BRL
        - Juros Máximo solicitado: ${details.minInterestRate}%
        - Score do tomador: ${details.score}
        - Número de Empréstimos: ${details.loanCount}
        - Taxa de Inadimplência: ${details.userDefaultRate}%
        - Média de juros oferecido: ${details.averageIR}%
    `);
}

function displayMenu() {
    console.log('YaYa Score - Micro empréstimos e Score');
    console.log('1) Endereços');
    console.log('2) Solicitar empréstimo');
    console.log('3) Oferecer empréstimo');
    console.log('4) Finalizar solicitação de empréstimo');
    console.log('5) Marcar empréstimo como inadimplente');
    console.log('6) Pagar empréstimo');
    console.log('7) Visualizar Score');
    console.log('8) Cancelar solicitação de empréstimo');
    console.log('9) Listar contratos do usuário');
    console.log('10) Ver ofertas');
    console.log('11) Sair');
}

// Função para obter pedidos de empréstimos pendentes
async function getPendingLoanRequests() {
    try {
        return await contract.methods.getPendingLoanRequests().call();
    } catch (error) {
        console.error('Erro ao obter pedidos de empréstimos pendentes:', error);
        return [];
    }
}

// Função para finalizar um pedido de empréstimo
async function finalizeLoanRequest(requestId) {
    try {
        await sendTransaction(contract.methods.finalizeLoanRequest(requestId), { from: userAddress });
        console.log('Empréstimo finalizado com sucesso.');
    } catch (error) {
        console.error('Erro ao finalizar empréstimo:', error);
    }
}

// Função para marcar um empréstimo como inadimplente
async function markLoanAsDefaulted(loanId) {
    try {
        await sendTransaction(contract.methods.markLoanAsDefaulted(loanId), { from: userAddress });
        console.log('Empréstimo marcado como inadimplente com sucesso.');
    } catch (error) {
        console.error('Erro ao marcar empréstimo como inadimplente:', error);
    }
}

// Função para pagar de volta o empréstimo
async function repayLoan(loanId, amount) {
    try {
        await sendTransaction(contract.methods.repayLoan(loanId), { from: userAddress, value: amount });
        console.log('Empréstimo pago com sucesso.');
    } catch (error) {
        console.error('Erro ao pagar empréstimo:', error);
    }
}

// Função para obter endereços e balanços da rede
async function getAddresses() {
    try {
        const accounts = await web3.eth.getAccounts();
        const balances = await Promise.all(accounts.map(account => web3.eth.getBalance(account)));
        return accounts.map((account, index) => ({
            address: account,
            balance: web3.utils.fromWei(balances[index], 'ether')
        }));
    } catch (error) {
        console.error('Erro ao obter endereços:', error);
        return [];
    }
}

// Função para obter empréstimos de um usuário
async function getLoansByUser(address) {
    try {
        return await contract.methods.getLoansByUser(address).call();
    } catch (error) {
        console.error('Erro ao obter empréstimos do usuário:', error.message.split(': ').pop());
        return [];
    }
}

// Função para obter o score de um usuário
async function getScore(address) {
    try {
        return await contract.methods.getScore(address).call();
    } catch (error) {
        console.error('Erro ao obter o score:', error);
        return 0;
    }
}

// Função para cancelar um empréstimo
async function cancelLoanRequest(loanId) {
    try {
        await sendTransaction(contract.methods.cancelLoanRequest(loanId), { from: userAddress });
        console.log('Empréstimo cancelado com sucesso.');
    } catch (error) {
        console.error('Erro ao cancelar o empréstimo:', error);
    }
}

// Função para obter ofertas feitas por um usuário
async function getOffersByUser(address) {
    try {
        return await contract.methods.getOffersByUser(address).call();
    } catch (error) {
        console.error('Erro ao obter ofertas do usuário:', error);
        return [];
    }
}

// Menu interativo
async function interactive() {
    while (true) {

        displayMenu();

        const choice = readlineSync.questionInt('Escolha uma opção: ');
        switch (choice) {
            case 1: {
                const accounts = await getAddresses();
                accounts.forEach((account, index) => {
                    console.log(`${index + 1}) ${account.address} (Balance: ${account.balance} ETH)`);
                });
                const accountChoice = readlineSync.questionInt('Escolha um endereço: ');
                if (accountChoice > 0 && accountChoice <= accounts.length) {
                    userAddress = accounts[accountChoice - 1].address;
                    console.log(`Endereço definido como: ${userAddress}`);
                } else {
                    console.log('Escolha inválida.');
                }
                break;
            }
            case 2: {
                const amount = readlineSync.questionFloat('Digite o valor do empréstimo em BRL: ');
                const minInterestRate = readlineSync.questionInt('Digite o valor do juros mínimo desejado: ');
                await requestLoan(amount, minInterestRate);
                break;
            }
            case 3: {
                const pendingRequests = await getPendingLoanRequests();
                const validRequests = pendingRequests.filter(async requestId => {
                    const details = await contract.methods.getLoanRequestDetails(requestId).call();
                    return !details.cancelled;
                });

                if (validRequests.length === 0) {
                    console.log('Não há pedidos de empréstimos pendentes.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }

                validRequests.forEach((requestId, index) => {
                    console.log(`${index + 1}) Empréstimo ID: ${requestId}`);
                });

                const requestIdChoice = readlineSync.questionInt('Escolha um ID de empréstimo para ver os detalhes ou 0 para voltar: ');
                if (requestIdChoice === 0) continue;

                const requestId = validRequests[requestIdChoice - 1];
                const details = await contract.methods.getLoanRequestDetails(requestId).call();
                displayLoanDetails(details);

                const amount = readlineSync.questionFloat('Digite o valor que você quer dar emprestado em BRL: ');
                const interestRate = readlineSync.questionInt('Digite o valor do juros: ');
                await offerLoan(requestId, interestRate, amount);
                console.log('Oferta de empréstimo feita com sucesso.');
                break;
            }
            case 4: {
                const loans = userAddress === contractAddress ? await getLoansByUser(userAddress) : await getLoansByUser(userAddress);
                if (loans.length === 0) {
                    console.log('Não há empréstimos não leiloados.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                loans.forEach((loan, index) => {
                    console.log(`${index + 1}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                });
                const loanChoice = readlineSync.questionInt('Escolha um empréstimo para finalizar ou 0 para voltar: ');
                if (loanChoice !== 0) {
                    const loanId = loans[loanChoice - 1].id;
                    await finalizeLoanRequest(loanId);
                }
                break;
            }
            case 5: {
                const loans = await getLoansByUser(userAddress);
                const activeLoans = loans.filter(loan => loan.status === "ativo");

                if (activeLoans.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }

                activeLoans.forEach((loan, index) => {
                    console.log(`${index + 1}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                });

                const loanChoice = readlineSync.questionInt('Escolha um empréstimo para marcar como inadimplente ou 0 para voltar: ');
                if (loanChoice !== 0) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    await markLoanAsDefaulted(loanId);
                    console.log('Empréstimo marcado como inadimplente com sucesso.');
                }
                break;
            }
            case 6: {
                const loans = await getLoansByUser(userAddress);
                const activeLoans = loans.filter(loan => loan.status === "ativo");

                if (activeLoans.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }

                activeLoans.forEach((loan, index) => {
                    console.log(`${index + 1}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                });

                const loanChoice = readlineSync.questionInt('Escolha um empréstimo para pagar ou 0 para voltar: ');
                if (loanChoice !== 0) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    const amountPaid = await contract.methods.getAmountPaid(loanId).call();
                    const remainingAmount = await contract.methods.getRemainingAmount(loanId).call();
                    console.log(`Valor já pago: ${amountPaid} BRL`);
                    console.log(`Valor restante: ${remainingAmount} BRL`);
                    const amountToPay = readlineSync.questionFloat('Digite o valor a ser pago em BRL: ');
                    await repayLoan(loanId, amountToPay);
                }
                break;
            }
            case 7: {
                const score = await getScore(userAddress);
                console.log(`Seu score é: ${score}`);
                break;
            }
            case 8: {
                const loans = await getLoansByUser(userAddress);
                const activeLoans = loans.filter(loan => loan.status === "ativo");

                if (activeLoans.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }

                activeLoans.forEach((loan, index) => {
                    console.log(`${index + 1}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                });

                const loanChoice = readlineSync.questionInt('Escolha um empréstimo para cancelar ou 0 para voltar: ');
                if (loanChoice !== 0) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    await cancelLoanRequest(loanId);
                    console.log('Empréstimo cancelado com sucesso.');
                }
                break;
            }
            case 9: {
                const loans = await getLoansByUser(userAddress);
                if (loans.length === 0) {
                    console.log('Não há empréstimos para este usuário.');
                } else {
                    loans.forEach((loan, index) => {
                        console.log(`${index + 1}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                    });
                }
                readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                break;
            }
            case 10: {
                const offers = await getOffersByUser(userAddress);
                if (offers.length === 0) {
                    console.log('Não há ofertas para este usuário.');
                } else {
                    offers.forEach((offer, index) => {
                        console.log(`${index + 1}) Oferta ID: ${offer.id} (Status: ${offer.status})`);
                    });
                }
                readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                break;
            }
            case 11:
                console.log('Saindo...');
                process.exit(0);
            default:
                console.log('Escolha inválida.');
                break;
        }
    }
}

// Inicialização do menu interativo
interactive().catch(error => console.error('Erro ao executar o script:', error));
