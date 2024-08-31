# Yaya Score - Source Code

## Introdução

Bem-vindo ao repositório técnico do Yaya Score, onde você encontrará a implementação do revolucionário sistema de microempréstimos baseado em blockchain. O Yaya Score é uma plataforma dedicada a facilitar microempréstimos de forma segura e transparente, proporcionando aos usuários a oportunidade de emprestar dinheiro diretamente uns aos outros por meio de leilões ou anunciarem empréstimos disponíveis.

## Business Model Canvas (BMC)

Aqui está uma visualização do nosso modelo de negócios, que orienta a estrutura e a estratégia por trás do Yaya Score:

<p align="center">
  <img src="https://github.com/YayaScore/YayaScore-Blockchain/blob/main/docs/BMC.jpg" alt="BMC">
</p>

## Conteúdo do Repositório - Principais arquivos e diretórios

### 1. [build](builds/)
Diretório dedicado a salvar os arquivos resultantes da compilação do contrato, como a ABI e o JSON.

### 2. [contracts](contracts/)
Nessa pasta encontra-se o arquivo do contrato do inteligente em Solidity, código fonte da implementação do sistema do Yaya Score. Nele estão definidos os algorítimos e regras de negócio para execução das lógicas de transação o outros componentes do sistema. 

### 3. [contracts/scripts](contracts/scripts)
As interfaces (CLI) estão definidas nos scripts para interação com o contrato inteligente. Em [_interact.mjs_](contracts/scripts/interact.msj) tem-se o script de interação com o contrato na rede local Ganache, já o arquivo [_interactHolensky.msj_](contracts/scripts/interactHolensky.mjs) refere-se ao script de interação com o contrato através da rede de teste Holensky. A necessidade de scripts diferentes para interação é justificada, além de questões organizacionais, pela diferença de execução das funções do contrato. Na rede de teste Holensky há a necessidade de assinatura da transação antes do envio da mesma, o que exige tratamento especial de cálculo de gas e chamada da função do contrato.  

### 4. [docs](docs/)
A pasta docs contém toda a documentação do projeto, incluindo manuais de usuário, especificações técnicas, e quaisquer outros documentos relevantes para entender e utilizar o Yaya Score.

### 5. [migrations](migrations/)
_`Migrations`_ é o diretório no qual estão os scripts para publicação do contrato nas rede a partir do comando ```truffle migrate```:

- [_1_deploy_contracts.js_](migrations/1_deploy_contracts.js): Realiza a publicação do contrato na rede Ganache, transferindo o valor de ```99 ether``` do endereço de deploy para o contrato.

- [_2_deploy_contracts_holensky.js_](migrations/2_deploy_contracts.js): Realiza o deploy do contrato na rede de teste Holensky, transferindo o valor de ```1 ether``` do endereço principal para o saldo do contrato.

### 6. [public](public/) & [src](src/)
Os diretórios [public](public/) e [src](src/) armazenam os programas e recursos da interface gráfica (Descontínuada) desenvolvida em Vue.js.

## Documentação e guia de uso

### Configuração básica
Requisitos:

- Node 16.13.2 
- Ganache
- Truffle

Clone o repositório:

```bash
git clone --single-branch --depth 1 -b version2.0 https://github.com/YayaScore/YayaScore-Blockchain
```

Instale as dependências:

```bash
npm install
```

Veja o guia para uso da plataforma:

### [Guia para uso do sistema na rede Ganache](docs/BuildAndRun-Ganache.md)

### [Guia para uso do sistema na rede Holensky](docs/BuildAndRun-Holensky.md)

### [Configuração para uso do Vue.js](docs/BuildAndRun-Vue.md) - Discontinued

----

Este repositório é o ponto central para todo o desenvolvimento e acompanhamento do projeto Yaya Score. Se você tiver alguma dúvida ou sugestão, sinta-se à vontade para contribuir ou entrar em contato com a equipe de desenvolvimento.
