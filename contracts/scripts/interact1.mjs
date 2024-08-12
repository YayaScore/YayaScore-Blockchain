import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import readlineSync from 'readline-sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuração para obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração da conexão com o nó Ethereum
const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545'); // Altere para o seu nó Ethereum

// Endereço do contrato implantado
const contractAddress = '0xCEf9751F74fD8C8bC342D3f62F97b88dB78a0706';

// Leitura do ABI do contrato
const contractABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../build/contracts/Score.json'), 'utf8')).abi;

// Criação da instância do contrato
const contract = new web3.eth.Contract(contractABI, contractAddress);

let userAddress = '';

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
        const gas = await contract.methods.requestLoan(amount, minInterestRate).estimateGas({ from: userAddress });
        await contract.methods.requestLoan(amount, minInterestRate).send({ from: userAddress, gas });
        console.log('Empréstimo solicitado com sucesso.');
    } catch (error) {
        console.error('Erro ao solicitar empréstimo:', error);
    }
}

// Função para oferecer um empréstimo com interface amigável
async function offerLoan(requestId, interestRate, amount) {
    try {
        const details = await contract.methods.getLoanRequestDetails(requestId).call();
        console.log(`
            Detalhes do Pedido de Empréstimo:
            - Tomador: ${details.borrower}
            - Valor: ${web3.utils.fromWei(details.amount.toString(), 'ether')} ETH
            - Juros Mínimos: ${details.minInterestRate}%
            - Score: ${details.score}
            - Número de Empréstimos: ${details.loanCount}
            - Taxa de Inadimplência: ${details.userDefaultRate}%
            - Média de juros oferecido: ${details.averageIR}%
            `);
        const gas = await contract.methods.offerLoan(requestId, interestRate).estimateGas({ from: userAddress, value: amount });
        await contract.methods.offerLoan(requestId, interestRate).send({ from: userAddress, value: amount, gas });
        console.log('Oferta de empréstimo feita com sucesso.');
    } catch (error) {
        console.error('Erro ao oferecer empréstimo:', error);
    }
}

// Função para obter pedidos de empréstimos pendentes
async function getPendingLoanRequests() {
    try {
        const pendingRequests = await contract.methods.getPendingLoanRequests().call();
        return pendingRequests;
    } catch (error) {
        console.error('Erro ao obter pedidos de empréstimos pendentes:', error);
        return [];
    }
}

// Função para aceitar a melhor oferta de empréstimo
async function finalizeLoanRequest(requestId) {
    try {
        const gas = await contract.methods.finalizeLoanRequest(requestId).estimateGas({ from: userAddress });
        await contract.methods.finalizeLoanRequest(requestId).send({ from: userAddress, gas });
        console.log('Empréstimo finalizado com sucesso.');
    } catch (error) {
        console.error('Erro ao finalizar empréstimo:', error);
    }
}

// Função para marcar um empréstimo como inadimplente
async function markLoanAsDefaulted(loanId) {
    try {
        const gas = await contract.methods.markLoanAsDefaulted(loanId).estimateGas({ from: userAddress });
        await contract.methods.markLoanAsDefaulted(loanId).send({ from: userAddress, gas });
        console.log('Empréstimo marcado como inadimplente com sucesso.');
    } catch (error) {
        console.error('Erro ao marcar empréstimo como inadimplente:', error);
    }
}

// Função para pagar de volta o empréstimo
async function repayLoan(loanId, amount) {
    try {
        const gas = await contract.methods.repayLoan(loanId).estimateGas({ from: userAddress, value: amount });
        await contract.methods.repayLoan(loanId).send({ from: userAddress, value: amount, gas });
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
        const loans = await contract.methods.getLoansByUser(address).call();
        return loans;
    } catch (error) {
        const errorMessage = error.message.split(': ').pop();
        console.error('Erro ao obter empréstimos do usuário:', errorMessage);
        return [];
    }
}

// Função para obter o saldo pendente de um empréstimo
async function getAmountPaid(loanId) {
    try {
        return await contract.methods.getAmountPaid(loanId).call();
    } catch (error) {
        console.error('Erro ao obter o valor pago do empréstimo:', error);
        return 0;
    }
}

// Função para obter o valor restante de um empréstimo
async function getRemainingAmount(loanId) {
    try {
        return await contract.methods.getRemainingAmount(loanId).call();
    } catch (error) {
        console.error('Erro ao obter o valor restante do empréstimo:', error);
        return 0;
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
        const gas = await contract.methods.cancelLoanRequest(loanId).estimateGas({ from: userAddress });
        await contract.methods.cancelLoanRequest(loanId).send({ from: userAddress, gas });
        console.log('Empréstimo cancelado com sucesso.');
    } catch (error) {
        console.error('Erro ao cancelar o empréstimo:', error);
    }
}

// Função para obter empréstimos não leiloados por usuário
async function getUnauctionedLoansByUser(address) {
    try {
        return await contract.methods.getUnauctionedLoansByUser(address).call();
    } catch (error) {
        console.error('Erro ao obter empréstimos não leiloados do usuário:', error);
        return [];
    }
}

// Função para obter todos os empréstimos não leiloados
async function getAllUnauctionedLoans() {
    try {
        return await contract.methods.getAllUnauctionedLoans().call();
    } catch (error) {
        console.error('Erro ao obter todos os empréstimos não leiloados:', error);
        return [];
    }
}

async function getContractBalance() {
    try {
        const balance = await web3.eth.getBalance(contractAddress);
        return balance;
    } catch (error) {
        const errorMessage = error.message.split(': ').pop();
        console.error('Erro ao obter o saldo do contrato:', errorMessage);
        return null;
    }
}

// Função para obter ofertas feitas por um usuário
async function getOffersByUser(address) {
    try {
        const offers = await contract.methods.getOffersByUser(address).call();
        return offers;
    } catch (error) {
        console.error('Erro ao obter ofertas do usuário:', error);
        return [];
    }
}

async function getOfferDetails(offerId) {
    try {
        const details = await contract.methods.getLoanRequestDetails(offerId).call();
        const offers = await contract.methods.getLoanOffers(offerId).call();
        const amountRepaid = await contract.methods.getAmountPaid(offerId).call();
        const remainingAmount = await contract.methods.getRemainingAmount(offerId).call();

        details.amountRepaid = amountRepaid; // Adiciona amountRepaid aos detalhes
        details.remainingAmount = remainingAmount; // Adiciona remainingAmount aos detalhes

        return { details, offers };
    } catch (error) {
        console.error('Erro ao obter detalhes da oferta:', error);
        return { details: null, offers: null };
    }
}

async function interactive() {
    while (true) {
        // Atualizar o menu interativo
        console.log(`YaYa Score - Micro empréstimos e Score\n1) Address \n2) Request a Loan \n3) Offer a Loan \n4) Finalize Loan Request \n5) Mark Loan as Defaulted \n6) Repay Loan \n7) Score \n8) Cancel Loan \n9) List Loans by User \n10) See Offers by User \n11) Exit \n`);

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
                console.log(`\n1) Solicitar Empréstimo \n2) Voltar para a tela inicial `);
                const subChoice = readlineSync.questionInt('Escolha uma opção: ');
                if (subChoice === 1) {
                    const amount = readlineSync.questionFloat('Digite o valor do empréstimo em Ether: ');
                    const minInterestRate = readlineSync.questionInt('Digite o valor do juros mínimo desejado: ');
                    await requestLoan(web3.utils.toWei(amount.toString(), 'ether'), minInterestRate);
                }
                break;
            }
            case 3: {
                const pendingRequests = await getPendingLoanRequests();
                const validRequests = [];
                for (const requestId of pendingRequests) {
                    const details = await contract.methods.getLoanRequestDetails(requestId).call();
                    if (!details.cancelled) {
                        validRequests.push(requestId);
                    }
                }

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
                if (requestIdChoice > 0 && requestIdChoice <= validRequests.length) {
                    const requestId = validRequests[requestIdChoice - 1];
                    const details = await contract.methods.getLoanRequestDetails(requestId).call();
                    console.log(`Detalhes do Pedido de Empréstimo: \n- Tomador: ${details.borrower} \n- Valor: ${web3.utils.fromWei(details.amount.toString(), 'ether')} ETH \n- Juros Máximo: ${details.minInterestRate}% \n- Score: ${details.score} \n- Número de Empréstimos: ${details.loanCount} \n- Taxa de Inadimplência: ${details.userDefaultRate}% \n- Média de juros oferecido: ${details.averageIR}%`);
                    console.log(`\n1) Fazer Empréstimo \n2) Voltar para a tela inicial `);
                    const offerChoice = readlineSync.questionInt('Escolha uma opção: ');
                    if (offerChoice === 1) {
                        const amount = readlineSync.questionFloat('Digite o valor que você quer dar emprestado em Ether: ');
                        const interestRate = readlineSync.questionInt('Digite o valor do juros: ');
                        await offerLoan(requestId, interestRate, web3.utils.toWei(amount.toString(), 'ether'));
                        console.log('Oferta de empréstimo feita com sucesso.');
                    }
                } else {
                    console.log('Escolha inválida.');
                }
                break;
            }
            case 4: {
                const loans = userAddress === contractAddress ? await getAllUnauctionedLoans() : await getUnauctionedLoansByUser(userAddress);
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
                    console.log(`\n1) Finalizar Empréstimo \n2) Voltar para a tela inicial `);
                    const finalizeChoice = readlineSync.questionInt('Escolha uma opção: ');
                    if (finalizeChoice === 1) {
                        await finalizeLoanRequest(loanId);
                    }
                }
                break;
            }
            case 5: {
                let loanIds = await getLoansByUser(userAddress);
                if (loanIds.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                let index = 1;
                let activeLoans = [];
                loanIds.forEach((loan) => {
                    if (loan.status === "ativo") {
                        activeLoans.push(loan);
                        console.log(`${index}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                        index++;
                    }
                });
                if (activeLoans.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                let loanChoice = readlineSync.questionInt('Escolha um empréstimo para marcar como inadimplente ou 0 para voltar: ');
                if (loanChoice === 0) continue;
                if (loanChoice > 0 && loanChoice <= activeLoans.length) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    console.log(`\n1) Marcar como inadimplente \n2) Voltar para a tela inicial `);
                    const defaultChoice = readlineSync.questionInt('Escolha uma opção: ');
                    if (defaultChoice === 1) {
                        await markLoanAsDefaulted(loanId);
                        console.log('Empréstimo marcado como inadimplente com sucesso.');
                    }
                } else {
                    console.log('Escolha inválida.');
                }
                break;
            }
            case 6: {
                let loanIds = await getLoansByUser(userAddress);
                if (loanIds.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                let index = 1;
                let activeLoans = [];
                loanIds.forEach((loan) => {
                    if (loan.status === "ativo") {
                        activeLoans.push(loan);
                        console.log(`${index}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                        index++;
                    }
                });
                if (activeLoans.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                let loanChoice = readlineSync.questionInt('Escolha um empréstimo para pagar ou 0 para voltar: ');
                if (loanChoice === 0) continue;
                if (loanChoice > 0 && loanChoice <= activeLoans.length) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    console.log(`\n1) Pagar Empréstimo \n2) Voltar para a tela inicial `);
                    const repayChoice = readlineSync.questionInt('Escolha uma opção: ');
                    if (repayChoice === 1) {
                        const amountPaid = await getAmountPaid(loanId);
                        const remainingAmount = await getRemainingAmount(loanId);
                        console.log(`Valor já pago: ${web3.utils.fromWei(amountPaid, 'ether')} ETH`);
                        console.log(`Valor restante: ${web3.utils.fromWei(remainingAmount, 'ether')} ETH`);
                        const amountToPay = readlineSync.questionFloat('Digite o valor a ser pago em Ether: ');
                        await repayLoan(loanId, web3.utils.toWei(amountToPay.toString(), 'ether'));
                        console.log('Empréstimo pago com sucesso.');
                    }
                } else {
                    console.log('Escolha inválida.');
                }
                break;
            }
            case 7: {
                const score = await getScore(userAddress);
                console.log(`Seu score é: ${score}`);
                break;
            }
            case 8: {
                let loanIds = await getLoansByUser(userAddress);
                if (loanIds.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                let index = 1;
                let activeLoans = [];
                loanIds.forEach((loan) => {
                    if (loan.status === "ativo") {
                        activeLoans.push(loan);
                        console.log(`${index}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                        index++;
                    }
                });
                if (activeLoans.length === 0) {
                    console.log('Não há empréstimos ativos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                let loanChoice = readlineSync.questionInt('Escolha um empréstimo para cancelar ou 0 para voltar: ');
                if (loanChoice === 0) continue;
                if (loanChoice > 0 && loanChoice <= activeLoans.length) {
                    const loanId = activeLoans[loanChoice - 1].id;
                    console.log(`\n1) Cancelar Empréstimo \n2) Voltar para a tela inicial `);
                    const cancelChoice = readlineSync.questionInt('Escolha uma opção: ');
                    if (cancelChoice === 1) {
                        await cancelLoan(loanId);
                        console.log('Empréstimo cancelado com sucesso.');
                    }
                } else {
                    console.log('Escolha inválida.');
                }
                break;
            }
            case 9: {
                const loans = await getLoansByUser(userAddress);
                if (loans.length === 0) {
                    console.log('Não há empréstimos para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                loans.forEach((loan, index) => {
                    console.log(`${index + 1}) Empréstimo ID: ${loan.id} (Status: ${loan.status})`);
                });
                readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                break;
            }
            case 10: {
                const offers = await getOffersByUser(userAddress);
                if (offers.length === 0) {
                    console.log('Não há ofertas para este usuário.');
                    readlineSync.question('Pressione Enter para voltar para a tela inicial.');
                    continue;
                }
                offers.forEach((offer, index) => {
                    console.log(`${index + 1}) Oferta ID: ${offer.id} (Status: ${offer.status})`);
                });
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
interactive().catch(error => console.error('Erro ao executar o script:', error));
