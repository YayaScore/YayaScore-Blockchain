# Yaya Score - Guide 

## Pré-requisitos

Certifique-se de que todas as dependências necessárias foram instaladas.

## Passos para iniciar a rede de teste Ganache:

### 1. Adicione a rede Holensky nas configurações do metamask.
```bash
    Network Name: Holesky
    New RPC URL: https://rpc.holesky.ethpandaops.io
    Chain ID: 17000
    Currency Symbol: ETH
    Block Explorer URL: https://dora.holesky.ethpandaops.io/
```

### 2. Gerencie as carteiras do metamask na nova rede

Crie e adicione carteiras para interagir com o contrato simulando diferentes usuários

### 3. Resgate Ethers de maneira gratuta

Acesse https://cloud.google.com/application/web3/faucet selecione a rede Holensky e receba ether na carteira desejada.

### 4. Gere o link para o nó de acesso a rede Holensky

Acessando a plataforma [Alchemy](https://www.alchemy.com/holesky) é preciso criar uma conta e configurar um app de acesso a rede Holensky a fim de gerar um link de acesso ao nó da rede de testes. Esse link será utilizado pelo truffle para fazer o deploy do contrato.

### 5. Modifique as configurações do arquivo [truffle-config.js](truffle-config.js)

Modifique as configurações da rede na seção `holensky`, alterando o nó da rede de testes para o gerado pela plataforma Alchemy.

### 6. No terminal, navegue até a pasta raiz do projeto:
```bash
cd /path/to/YayaScore-Blockchain
```

### 7. Compile os contratos inteligentes usando o Truffle:
```bash
truffle compile
```

### 8. Migre os contratos para a rede de teste:
```bash
truffle migrate --network holensky
```

O comando truffle migrate mostra como resultado algumas informações sobre o contrato e a rede de testes, uma dessas informações é o endereço do contrato. Guarde essa informação pois será necessária para executar o script de interação.

### 9. Execute o script de interação _interactHolensky.mjs_:
```bash
node contracts/scripts/interactHolensky.mjs <contract-address>
```
