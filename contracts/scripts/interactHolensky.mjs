import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import readlineSync from 'readline-sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const conversionRate = 67920000000000; // 1 BRL in Wei

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
const web3 = new Web3(Web3.givenProvider || 'https://eth-holesky.g.alchemy.com/v2/cuarhBx4On1Z8xiHjnbH3qmsHy9_ywGc'); // Altere para o seu nó Ethereum

// Endereço do contrato implantado
const contractAddress = args[0];

// Leitura do ABI do contrato
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../build/contracts/Score.json'), 'utf8')).abi;

// Criação da instância do contrato
const contract = new web3.eth.Contract(contractABI, contractAddress);

let userAddress = '';
let userPrivateKey = '';

function _convertBRLtoWei(amountInBRL) {
    return amountInBRL * conversionRate;
}

function _convertWeiToBRL(amountInWei) {
    return Number(amountInWei) / conversionRate;
}

// Função genérica para estimar e enviar transações
async function sendTransaction(method, options = {}) {
    const tx = {
        from: userAddress,
        to: contractAddress,
        data: method.encodeABI(),
        gas: await method.estimateGas(options),
        gasPrice: await web3.eth.getGasPrice()
    };

    const signedTX = await web3.eth.accounts.signTransaction(tx, userPrivateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTX.rawTransaction);

    return receipt;
}

// Função para obter detalhes de um pedido de empréstimo
async function getLoanRequestDetails(requestId) {
    try {
        const details = await contract.methods.getLoanRequestDetails(requestId).call();
        console.log('Detalhes do Pedido de Empréstimo:', details);
    } catch (error) {
        console.error('Erro ao obter detalhes do pedido de empréstimo:', error); }
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
    let value = _convertWeiToBRL(BigInt(details.amount));
    console.log(`
        Detalhes do Pedido de Empréstimo:
        - Tomador: ${details.borrower}
        - Valor: ${value} BRL 
        - Juros Mínimos: ${details.minInterestRate}%
        - Score: ${details.score}
        - Número de Empréstimos: ${details.loanCount}
        - Taxa de Inadimplência: ${details.userDefaultRate}%
        - Média de juros oferecido: ${details.averageIR}%
    `);
}

function displayMenu() {
    console.log('\n1) Solicitar empréstimo');
    console.log('2) Oferecer empréstimo');
    console.log('3) Finalizar solicitação de empréstimo');
    console.log('4) Marcar empréstimo como inadimplente');
    console.log('5) Pagar empréstimo');
    console.log('6) Visualizar Score');
    console.log('7) Cancelar solicitação de empréstimo');
    console.log('8) Listar contratos do usuário');
    console.log('9) Ver ofertas');
    console.log('10) Sair\n');
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
        const tx = {
            from: userAddress,
            to: contractAddress,
            gas: await contract.methods.repayLoan(loanId).estimateGas({ from: userAddress, value: amount }),
            gasPrice: await web3.eth.getGasPrice(),
            data: contract.methods.repayLoan(loanId).encodeABI(),
            value: amount
        }

        const signed = await web3.eth.accounts.signTransaction(tx, userPrivateKey);
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
//         await sendTransaction(contract.methods.repayLoan(loanId), { from: userAddress, value: amount });
//        const gas = await contract.methods.repayLoan(loanId).estimateGas({ from: userAddress, value: amount });
//        await contract.methods.repayLoan(loanId).send({ from: userAddress, value: amount, gas });
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

let loggedIn = false;

async function logIn() {
    console.log("YaYa Score - Miccro Empréstimos e Score");
    console.log("1) Fazer LogIn");
    console.log("2) Sair");
    const choice = readlineSync.questionInt("\nEscolha uma opção: ");
    switch (choice) {
        case 1:
            const cpf = readlineSync.question("\nCPF: ");
            userAddress = readlineSync.question("Endereço da carteira: ");
            userPrivateKey = readlineSync.question("Chave privada: ");
            interactive();
            break;
        case 2:
            console.log("Saindo...");
            break;
        default:
            console.log("Opção Inválida");
            break;
    }
}

// Menu interativo
async function interactive() {
    while (true) {
        displayMenu();

        const choice = readlineSync.questionInt('Escolha uma opção: ');
        switch (choice) {
            case 1: {
                const amountInBRL = readlineSync.questionFloat('Digite o valor do empréstimo: ');
                const minInterestRate = readlineSync.questionInt('Digite o valor do juros mínimo desejado: ');
                const amount = _convertBRLtoWei(amountInBRL);
                await requestLoan(amount, minInterestRate);
                break;
            }
            case 2: {
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

                const amountBRL = readlineSync.questionFloat('Confirme o valor a ser emprestado: ');
                const interestRate = readlineSync.questionInt('Digite o valor do juros: ');
                const amountWei = _convertBRLtoWei(amountBRL);
                await offerLoan(requestId, interestRate, amountWei);
                console.log('Oferta de empréstimo feita com sucesso.');
                break;
            }
            case 3: {
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
            case 4: {
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

                const loanChoice = readlineSync.questionInt('Escolha um empréstimo para pagar ou 0 para voltar: ');
                if (loanChoice !== 0) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    const amountPaid = await contract.methods.getAmountPaid(loanId).call();
                    const remainingAmount = await contract.methods.getRemainingAmount(loanId).call();
                    const amountPaidBRL = _convertWeiToBRL(amountPaid);
                    const remainingAmountBRL = _convertWeiToBRL(remainingAmount)
                    console.log(`Valor já pago: ${amountPaidBRL} BRL`);
                    console.log(`Valor restante: ${remainingAmountBRL} BRL`);
                    const amountToPayBRL = readlineSync.questionFloat('Digite o valor a ser pago: ');
                    const amountToPayWei = _convertBRLtoWei(amountToPayBRL);
                    await repayLoan(loanId, amountToPayWei);
                    console.log('Empréstimo pago com sucesso.');
                }
                break;
            }
            case 6: {
                const score = await getScore(userAddress);
                console.log(`Seu score é: ${score}`);
                break;
            }
            case 7: {
                const loans = await getLoansByUser(userAddress);
                const activeLoans = loans.filter(loan => loan.status === "pendente");

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
            case 8: {
                const loans = await getLoansByUser(userAddress);
                if (loans.length === 0) {
                    console.log("Não há empréstimos para esse usuário");
                    break;
                } else {
                    while (true) { 
                        loans.forEach((loan, index) => {
                            console.log(`${index + 1} - Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                        });
                        const choice = readlineSync.questionInt("\nSelecione um empréstimo para visualizar os detalhes ou 0 para voltar: ");
                        if (choice === 0) {
                            break;
                        } else if (choice > 0 && choice <= loans.length) {
                            const loanId = loans[choice - 1].id;
                            const details = await contract.methods.getLoanRequestDetails(loanId).call();
                            displayLoanDetails(details);
                            console.log("----");
                        } else {
                            console.log("Escolha inválida.");
                        }
                    }
                }
                break;
            }
            case 9: {
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
            case 10:
                console.log('Saindo...');
                process.exit(0);
            default:
                console.log('Escolha inválida.');
                break;
        }
    }
}

// Inicialização do menu interativo
logIn().catch(error => console.error('Erro ao executar o script:', error));
