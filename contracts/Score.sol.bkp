// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Score {

    uint constant alpha = 0.5 * 10**18;
    uint constant maxLoansPerUser = 3;

    struct LoanRequest {
        address payable borrower;
        uint amount;
        uint minInterestRate;
        bool fulfilled;
        bool cancelled;
        uint requestTime;
    }

    struct LoanOffer {
        address lender;
        uint interestRate;
        uint amount;
        bool accepted;
    }

    struct Loan {
        address lender;
        address borrower;
        uint amount;
        uint interestRate;
        bool repaid;
        bool defaulted; 
        uint amountRepaid;
    }

    struct LoanInfo {
        uint id;
        string status;
    }

    mapping(address => uint) public scores;
    mapping(address => uint) public loanCounts;
    mapping(address => uint) public totalBorrowed;
    mapping(address => uint) public totalRepaid;
    mapping(uint => LoanRequest) public loanRequests;
    mapping(uint => LoanOffer[]) public loanOffers;
    mapping(uint => Loan) public activeLoans;
    uint public loanRequestCounter;
    uint public reserveFund;
    uint public defaultRate;
    uint public totalLoans;
    uint public defaultedLoans;

    mapping(address => uint) public pendingReturns; // Saldo de Ether a ser devolvido aos credores

    event LoanRequested(uint requestId, address indexed borrower, uint amount, uint score, uint loanCount);
    event LoanOffered(uint requestId, address indexed lender, uint interestRate);
    event LoanFulfilled(uint loanId, address indexed borrower, address indexed lender, uint amount, uint interestRate);
    event LoanRepaid(uint loanId, address indexed borrower, address indexed lender, uint amount);
    event LoanDefaulted(uint loanId, address indexed borrower, address indexed lender, uint amount);
    event LoanFullyPaid(uint loanId, address indexed borrower, address indexed lender, uint amount);

    constructor() payable {
        reserveFund += msg.value; // Inicializa o fundo de reserva com o valor enviado no deploy
        defaultRate = 5;
    }

    // Função para solicitar um empréstimo
    function requestLoan(uint amount, uint minInterestRate) public {
        require(amount >= 5 ether && amount <= 99 ether, "Loan amount must be between 5 and 99 ether");
        require(getActiveLoanCount(msg.sender) < maxLoansPerUser, "Maximum loan requests reached");

        loanRequestCounter++;
        totalLoans++;

        // Inicializa o score do usuário com 500 se ele for novo (ou seja, se não tiver pegado nenhum empréstimo)
        if (loanCounts[msg.sender] == 0) {
            scores[msg.sender] = 500;
            totalBorrowed[msg.sender] = 0;
            totalRepaid[msg.sender] = 0;
        }

        loanCounts[msg.sender]++;
        totalBorrowed[msg.sender] += amount;

        loanRequests[loanRequestCounter] = LoanRequest({
            borrower: payable(msg.sender),
            amount: amount,
            minInterestRate: minInterestRate,
            fulfilled: false,
            cancelled: false,
            requestTime: block.timestamp
        });

        emit LoanRequested(loanRequestCounter, msg.sender, amount, scores[msg.sender], loanCounts[msg.sender]);
    }

    // Função para obter o número de empréstimos ativos de um usuário
    function getActiveLoanCount(address user) public view returns (uint) {
        uint count = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (loanRequests[i].borrower == user && !loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                count++;
            }
        }
        return count;
    }


    // Função para oferecer um empréstimo
    function offerLoan(uint requestId, uint interestRate) public payable {
        require(loanRequests[requestId].amount > 0, "Loan request does not exist");
        require(!loanRequests[requestId].fulfilled, "Loan request already fulfilled");
        require(loanRequests[requestId].borrower != msg.sender, "Borrower cannot offer loan on their own request");
        require(interestRate <= loanRequests[requestId].minInterestRate, "Interest rate too high");
        require(msg.value == loanRequests[requestId].amount, "Incorrect value sent");
        require(!loanRequests[requestId].cancelled, "Cannot offer loan on a cancelled request");

        // Verificação adicional para evitar múltiplas ofertas do mesmo usuário
        for (uint i = 0; i < loanOffers[requestId].length; i++) {
            require(loanOffers[requestId][i].lender != msg.sender, "Cannot offer more than once on the same loan request");
        }

        loanOffers[requestId].push(LoanOffer({
            lender: msg.sender,
            interestRate: interestRate,
            amount: msg.value,
            accepted: false
        }));

        emit LoanOffered(requestId, msg.sender, interestRate);
    }

    // Função para aceitar a melhor oferta de empréstimo ao chamar manualmente
    function finalizeLoanRequest(uint requestId) public {
        require(msg.sender == loanRequests[requestId].borrower || msg.sender == address(this), "Only the borrower or the contract can finalize the loan request");
        LoanRequest storage request = loanRequests[requestId];
        require(!request.fulfilled, "Loan request already fulfilled");
        require(!request.cancelled, "Cannot finalize a cancelled loan request");

        LoanOffer memory bestOffer;
        uint bestOfferIndex;
        bool offerFound = false;

        for (uint i = 0; i < loanOffers[requestId].length; i++) {
            if (!offerFound || loanOffers[requestId][i].interestRate < bestOffer.interestRate) {
                bestOffer = loanOffers[requestId][i];
                bestOfferIndex = i;
                offerFound = true;
            }
        }

        require(offerFound, "No valid offers found");

        request.fulfilled = true;
        loanOffers[requestId][bestOfferIndex].accepted = true;
        uint loanId = requestId;

        // Calcula a taxa de reserva com base na taxa de inadimplência
        uint feeRate = 5 + getDefaultRate(); // 0.5% base + taxa de inadimplência
        uint fee = (request.amount * feeRate) / 1000;
        reserveFund += fee;
        uint amountAfterFee = request.amount - fee;

        activeLoans[loanId] = Loan({
            lender: bestOffer.lender,
            borrower: request.borrower,
            amount: request.amount,
            interestRate: bestOffer.interestRate,
            repaid: false,
            defaulted: false, // Inicializa como não inadimplente
            amountRepaid: 0
        });

        // Transferir o valor do empréstimo do contrato para o tomador após deduzir a taxa
        request.borrower.transfer(amountAfterFee);

        // Devolver o dinheiro das outras ofertas não aceitas
        for (uint i = 0; i < loanOffers[requestId].length; i++) {
            if (!loanOffers[requestId][i].accepted) {
                uint amountToRefund = loanOffers[requestId][i].amount;
                loanOffers[requestId][i].amount = 0;
                payable(loanOffers[requestId][i].lender).transfer(amountToRefund);
            }
        }

        emit LoanFulfilled(loanId, request.borrower, bestOffer.lender, amountAfterFee, bestOffer.interestRate);
    }

    // Função para retirar os fundos pendentes
    function withdrawPendingReturns() public {
        uint amount = pendingReturns[msg.sender];
        require(amount > 0, "No pending returns");

        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function repayLoan(uint loanId) public payable {
        Loan storage loan = activeLoans[loanId];
        require(loan.borrower == msg.sender, "Only borrower can repay loan");
        require(!loan.repaid, "Loan already repaid");
        require(!loanRequests[loanId].cancelled, "Cannot repay a cancelled loan");

        uint amountToRepay = loan.amount + (loan.amount * loan.interestRate / 100);
        uint amountRemaining = amountToRepay - loan.amountRepaid;
        require(msg.value <= amountRemaining, "Amount exceeds the remaining balance");

        // Calcula a taxa de reserva com base na taxa de inadimplência
        uint feeRate = 5 + getDefaultRate(); // 0.5% base + taxa de inadimplência
        uint fee = (msg.value * feeRate) / 1000;
        reserveFund += fee;
        uint amountAfterFee = msg.value - fee;

        loan.amountRepaid += msg.value;
        totalRepaid[msg.sender] += msg.value;

        if (loan.amountRepaid >= amountToRepay) {
            loan.repaid = true;
            // Atualiza o score do tomador positivamente
            scores[msg.sender] = calculateScoreIncrement(loan.amount, loanCounts[msg.sender], (totalRepaid[msg.sender] * 100) / totalBorrowed[msg.sender], scores[msg.sender], alpha);
            emit LoanFullyPaid(loanId, loan.borrower, loan.lender, msg.value);
        } else {
            // Marca como inadimplente se o valor total não for pago
            emit LoanDefaulted(loanId, loan.borrower, loan.lender, msg.value);
        }

        payable(loan.lender).transfer(amountAfterFee);

        emit LoanRepaid(loanId, loan.borrower, loan.lender, msg.value);
    }

    // Função para marcar um empréstimo como inadimplente
    function markLoanAsDefaulted(uint loanId) public {
        require(msg.sender == activeLoans[loanId].borrower || msg.sender == address(this), "Only the borrower or the contract can mark the loan as defaulted");
        Loan storage loan = activeLoans[loanId];
        require(!loan.repaid, "Loan already repaid");
        require(!loan.defaulted, "Loan already marked as defaulted");

        uint amountRemaining = loan.amount - loan.amountRepaid;

        require(reserveFund >= amountRemaining, "Insufficient reserve fund");

        loan.defaulted = true; // Marcar como inadimplente
        reserveFund -= amountRemaining;
        payable(loan.lender).transfer(amountRemaining);

        // Atualiza o score do mutuário negativamente
        scores[loan.borrower] = calculateScoreDecrement(loan.amount, loan.amountRepaid, loanCounts[loan.borrower], (totalRepaid[loan.borrower] * 100) / totalBorrowed[loan.borrower], scores[loan.borrower]);
        defaultedLoans++;

        emit LoanDefaulted(loanId, loan.borrower, loan.lender, amountRemaining);
    }


    function calculateScoreIncrement(uint valorEmprestado, uint numEmprestimos, uint taxaPagamentoCompleto, uint scoreAtual, uint alphaValue) internal pure returns (uint) {
        // Pesos
        uint W_V = 50;
        uint W_P = 50;

        // Normalização
        uint V_normalizado = (valorEmprestado - 5) * 100 / (99 - 5);
        uint P_normalizado = taxaPagamentoCompleto;

        // Função de decaimento para número de empréstimos
        uint f_N = 100 * 10**18 / (1 * 10**18 + alphaValue * numEmprestimos);

        // Cálculo do valor normalizado total
        uint valor_normalizado = (W_V * V_normalizado + W_P * P_normalizado) / 100;

        // Cálculo do incremento do score ajustado pelo decaimento
        uint score_increment = valor_normalizado * 50 * f_N / 10000;

        // Garantir que o incremento do score não ultrapasse o limite máximo
        if (score_increment > 50) {
            score_increment = 50;
        }

        // Atualizar o score atual com o incremento calculado
        uint score_atualizado = scoreAtual + score_increment;

        if (score_atualizado > 1000) {
            score_atualizado = 1000;
        }

        return score_atualizado;
    }

    // Função para calcular o decremento do score
    function calculateScoreDecrement(uint valorEmprestado, uint valorPago, uint numEmprestimos, uint taxaPagamentoCompleto, uint scoreAtual) internal pure returns (uint) {
        // Pesos
        uint W_V = 1;
        uint W_P = 1;
        uint W_N = 1;

        // Calcular o valor devido com juros
        uint valorDevido = valorEmprestado * 105 / 100; // Assumindo uma taxa de juros de 5%

        // Razão de pagamento
        uint pagamentoRatio = valorPago * 100 / valorDevido;

        // Normalização
        uint V_normalizado = 100 - pagamentoRatio; // Menor pagamento resulta em maior valor normalizado
        uint P_normalizado = 100 - taxaPagamentoCompleto; // Menor taxa de pagamento completo resulta em maior valor normalizado

        // Função de decaimento para número de empréstimos
        uint f_N = 100 / (1 + numEmprestimos);

        // Cálculo do valor normalizado total
        uint valor_normalizado = (W_V * V_normalizado + W_P * P_normalizado + W_N * f_N) / 3;

        // Cálculo do decremento do score ajustado pelo decaimento e pela razão de pagamento
        uint score_decrement = valor_normalizado * 100 / 100;

        // Garantir que o decremento do score não ultrapasse o limite máximo
        if (score_decrement > 100) {
            score_decrement = 100;
        }

        // Atualizar o score atual com o decremento calculado
        uint score_atualizado = scoreAtual >= score_decrement ? scoreAtual - score_decrement : 0;

        return score_atualizado;
    }

    // Função para obter o saldo do fundo de reserva
    function getReserveFundBalance() public view returns (uint) {
        return reserveFund;
    }

    // Função para obter o score de um endereço
    function getScore(address account) public view returns (uint) {
        return scores[account];
    }

    // Função para adicionar fundos ao fundo de reserva
    function addToReserveFund() public payable {
        reserveFund += msg.value;
    }

    // Função para obter o valor já pago de um empréstimo
    function getAmountPaid(uint loanId) public view returns (uint) {
        Loan storage loan = activeLoans[loanId];
        return loan.amountRepaid;
    }

    // Função para obter o valor restante a ser pago de um empréstimo
    function getRemainingAmount(uint loanId) public view returns (uint) {
        Loan storage loan = activeLoans[loanId];
        uint amountToRepay = loan.amount + (loan.amount * loan.interestRate / 100);
        return amountToRepay - loan.amountRepaid;
    }

    // Função para obter o número de empréstimos tomados por um endereço
    function getLoanCount(address account) public view returns (uint) {
        return loanCounts[account];
    }

    // Função para obter o total pago de volta por um endereço
    function getTotalRepaid(address account) public view returns (uint) {
        return totalRepaid[account];
    }

    // Função para obter o total emprestado por um endereço
    function getTotalBorrowed(address account) public view returns (uint) {
        return totalBorrowed[account];
    }

    // Função para obter a taxa de inadimplência da rede
    function getDefaultRate() public view returns (uint) {
        if (totalLoans == 0) {
            return 0;
        }
        return (defaultedLoans * 100) / totalLoans;
    }

    event LogPendingLoanRequest(uint indexed requestId);

    function getPendingLoanRequests() public view returns (uint[] memory) 
    {
        require(loanRequestCounter > 0, "No loan requests exist");

        uint pendingCount = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (!loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                pendingCount++;
            }
        }

        uint[] memory pendingRequests = new uint[](pendingCount);
        uint index = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (!loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                pendingRequests[index] = i;
                index++;
            }
        }

        return pendingRequests;
    }

    // Função para obter detalhes de um pedido de empréstimo
    function getLoanRequestDetails(uint requestId) public view returns (
        address borrower,
        uint amount,
        uint minInterestRate,
        uint score,
        uint loanCount,
        uint userDefaultRate
    ) {
        LoanRequest storage request = loanRequests[requestId];
        borrower = request.borrower;
        amount = request.amount;
        minInterestRate = request.minInterestRate;
        score = scores[borrower];
        loanCount = loanCounts[borrower];
        userDefaultRate = (totalLoans == 0) ? 0 : (defaultedLoans * 100) / totalLoans;
    }

    // Função para obter empréstimos de um usuário com status
    function getLoansByUser(address user) public view returns (LoanInfo[] memory) {
        uint count = 0;

        // Primeiro, conta o número de empréstimos para alocar a matriz de tamanho correto
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (loanRequests[i].borrower == user) {
                count++;
            }
        }

        LoanInfo[] memory loans = new LoanInfo[](count);
        uint index = 0;

        // Preenche a matriz com os IDs dos empréstimos do usuário e seus status
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (loanRequests[i].borrower == user) {
                string memory status;
                if (loanRequests[i].cancelled) {
                    status = "cancelado";
                } else if (loanRequests[i].fulfilled && activeLoans[i].repaid) {
                    status = "pago";
                } else if (loanRequests[i].fulfilled && activeLoans[i].defaulted) {
                    status = "inadimplente";
                } else if (loanRequests[i].fulfilled && !activeLoans[i].repaid) {
                    status = "ativo";
                } else {
                    status = "pendente";
                }
                loans[index] = LoanInfo(i, status);
                index++;
            }
        }

        return loans;
    }

    // Função para cancelar um pedido de empréstimo
    function cancelLoanRequest(uint requestId) public {
        LoanRequest storage request = loanRequests[requestId];
        require(request.borrower == msg.sender, "Only borrower can cancel the loan request");
        require(!request.fulfilled, "Loan request already fulfilled");
        require(!request.cancelled, "Loan request already cancelled");
        require(loanOffers[requestId].length == 0, "Loan request already has offers");

        request.cancelled = true;
    }

    // Função para listar empréstimos não leiloados por endereço
    function getUnauctionedLoansByUser(address user) public view returns (LoanInfo[] memory) {
        uint count = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (loanRequests[i].borrower == user && !loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                count++;
            }
        }
        LoanInfo[] memory loans = new LoanInfo[](count);
        uint index = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (loanRequests[i].borrower == user && !loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                string memory status = "unauctioned";
                loans[index] = LoanInfo(i, status);
                index++;
            }
        }
        return loans;
    }

    // Função para listar todos os empréstimos não leiloados
    function getAllUnauctionedLoans() public view returns (LoanInfo[] memory) {
        uint count = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (!loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                count++;
            }
        }
        LoanInfo[] memory loans = new LoanInfo[](count);
        uint index = 0;
        for (uint i = 1; i <= loanRequestCounter; i++) {
            if (!loanRequests[i].fulfilled && !loanRequests[i].cancelled) {
                string memory status = "unauctioned";
                loans[index] = LoanInfo(i, status);
                index++;
            }
        }
        return loans;
    }

    function getLoanOffers(uint requestId) public view returns (LoanOffer[] memory) {
        return loanOffers[requestId];
    }

    // Função para obter o saldo do contrato
    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    // Função para obter ofertas de empréstimo feitas por um usuário
    function getOffersByUser(address user) public view returns (LoanInfo[] memory) {
        uint offerCount = 0;

        // Primeiro, conta o número de ofertas do usuário para alocar a matriz de tamanho correto
        for (uint i = 1; i <= loanRequestCounter; i++) {
            for (uint j = 0; j < loanOffers[i].length; j++) {
                if (loanOffers[i][j].lender == user) {
                    offerCount++;
                }
            }
        }

        LoanInfo[] memory offers = new LoanInfo[](offerCount);
        uint index = 0;

        // Preenche a matriz com os IDs dos empréstimos do usuário e seus status
        for (uint i = 1; i <= loanRequestCounter; i++) {
            for (uint j = 0; j < loanOffers[i].length; j++) {
                if (loanOffers[i][j].lender == user) {
                    string memory status;
                    if (loanRequests[i].cancelled) {
                        status = "cancelado";
                    } else if (loanOffers[i][j].accepted && activeLoans[i].repaid) {
                        status = "pago";
                    } else if (loanOffers[i][j].accepted && !activeLoans[i].repaid && !activeLoans[i].defaulted) {
                        status = "ativo";
                    } else if (loanOffers[i][j].accepted && activeLoans[i].defaulted) {
                        status = "inadimplente";
                    } else if (!loanOffers[i][j].accepted && loanRequests[i].fulfilled) {
                        status = "leiloado-nao-ganho";
                    } else {
                        status = "leiloando";
                    }
                    offers[index] = LoanInfo(i, status);
                    index++;
                }
            }
        }

        return offers;
    }
}

