/**
    * Use this file to configure your truffle project. It's seeded with some
    * common settings for different networks and features like migrations,
    * compilation, and testing. Uncomment the ones you need or modify
    * them to suit your project as necessary.
    *
    * More information about configuration can be found at:
    *
    * https://trufflesuite.com/docs/truffle/reference/configuration
    *
    * Hands-off deployment with Infura
    * --------------------------------
    *
    * Do you have a complex application that requires lots of transactions to deploy?
    * Use this approach to make deployment a breeze 🏖️:
    *
    * Infura deployment needs a wallet provider (like @truffle/hdwallet-provider)
    * to sign transactions before they're sent to a remote public node.
    * Infura accounts are available for free at 🔍: https://infura.io/register
    *
    * You'll need a mnemonic - the twelve word phrase the wallet uses to generate
    * public/private key pairs. You can store your secrets 🤐 in a .env file.
    * In your project root, run `$ npm install dotenv`.
    * Create .env (which should be .gitignored) and declare your MNEMONIC
    * and Infura PROJECT_ID variables inside.
    * For example, your .env file will have the following structure:
    *
    * MNEMONIC = <Your 12 phrase mnemonic>
    * PROJECT_ID = <Your Infura project id>
    *
    * Deployment with Truffle Dashboard (Recommended for best security practice)
    * --------------------------------------------------------------------------
    *
    * Are you concerned about security and minimizing rekt status 🤔?
    * Use this method for best security:
    *
    * Truffle Dashboard lets you review transactions in detail, and leverages
    * MetaMask for signing, so there's no need to copy-paste your mnemonic.
    * More details can be found at 🔎:
    *
    * https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/
    */

require('dotenv').config();
// const { MNEMONIC, PROJECT_ID } = process.env;

const HDWalletProvider = require('@truffle/hdwallet-provider');
const PRIVATE_KEYS = [
    "68428d39342e23caccd55ff3e9af7f9407dcf0e791e57f58a021b0963ef48a2f", // Default wallet
    "231937e58b3be9646caf0478cfa5b3052b64e0fa3c688cbad2b3fa44ce90ae06",
    "b8f527571fd52dce23fbe7340c30ed512e7ace241266b0f70bebcb4e29cfdee0",
    "8f5bac21780414971fa6df9e6d37b2a0d678cdf92b973932ad0d04a237db28f6",
    "845ebcd89ba416ea5838b0e258cafdaddf5f7229c3a26e25771f2f8b0491ecfb",
    "17189570eb30fdf58f5385319873ed79ec937a63d9c13ddab9abfcf9accdd092",
    "2c17b41c1f3b3101c168ee827495a5241cc476618fb3eb7d581d700531666702",
    "c191ae3263c08cfb193aa3b27249cba754313b260ecc6b767f82c167e97780a8",
    "0c421c670031d8e90de910ed9fc343b46d52abfc31abb3580b860a0001b58946",
    "f8571df7296c7621f85f958ccf23015aee31ec9ff0af0541f0e0ddde05a26ac2",
    "b19689b63a03a38ec4191df69678c9bccec95022131bb4d2e52367fd1e40887b",
    "d48429bb860b1e542200dd6b523e739778a02db702dd2e417f07f2173f493d89",
];


module.exports = {
    /**
    * Networks define how you connect to your ethereum client and let you set the
    * defaults web3 uses to send transactions. If you don't specify one truffle
    * will spin up a managed Ganache instance for you on port 9545 when you
    * run `develop` or `test`. You can ask a truffle command to use a specific
    * network from the command line, e.g
    *
    * $ truffle test --network <network-name>
    */

    networks: {
        // Useful for testing. The `development` name is special - truffle uses it by default
        // if it's defined here and no other network is specified at the command line.
        // You should run a client (like ganache, geth, or parity) in a separate terminal
        // tab if you use this network and you must also set the `host`, `port` and `network_id`
        // options below to some value.
        //


        development: {
            host: "127.0.0.1",     // Localhost (default: none)
            port: 7545,            // Standard Ethereum port (default: none)
            network_id: "*",       // Any network (default: none)
        },

        holensky: {
            provider: () => new HDWalletProvider ({
                    privateKeys: PRIVATE_KEYS,
                    providerOrUrl: "https://eth-holesky.g.alchemy.com/v2/cuarhBx4On1Z8xiHjnbH3qmsHy9_ywGc"
                }),
            network_id: 17000,
        },


        //
        // An additional network, but with some advanced options…
        // advanced: {
            //   port: 8777,             // Custom port
            //   network_id: 1342,       // Custom network
            //   gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
            //   gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
            //   from: <address>,        // Account to send transactions from (default: accounts[0])
            //   websocket: true         // Enable EventEmitter interface for web3 (default: false)
            // },
        //
        // Useful for deploying to a public network.
        // Note: It's important to wrap the provider as a function to ensure truffle uses a new provider every time.
        // goerli: {
            //   provider: () => new HDWalletProvider(MNEMONIC, `https://goerli.infura.io/v3/${PROJECT_ID}`),
            //   network_id: 5,       // Goerli's id
            //   confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
            //   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
            //   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
            // },
        //
        // Useful for private networks
        // private: {
            //   provider: () => new HDWalletProvider(MNEMONIC, `https://network.io`),
            //   network_id: 2111,   // This network is yours, in the cloud.
            //   production: true    // Treats this network as if it was a public net. (default: false)
            // }
    },

    // Set default mocha options here, use special reporters, etc.
    mocha: {
        // timeout: 100000
    },

    // Configure your compilers
    compilers: {
        solc: {
            version: "0.8.0",      // Fetch exact version from solc-bin (default: truffle's version)
            // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
            settings: {          // See the solidity docs for advice about optimization and evmVersion
                 optimizer: {
                       enabled: true,
                       runs: 2000
                     },
                //  evmVersion: "byzantium"
                }
        }
    },

    // Truffle DB is currently disabled by default; to enable it, change enabled:
    // false to enabled: true. The default storage location can also be
    // overridden by specifying the adapter settings, as shown in the commented code below.
    //
    // NOTE: It is not possible to migrate your contracts to truffle DB and you should
    // make a backup of your artifacts to a safe location before enabling this feature.
    //
    // After you backed up your artifacts you can utilize db by running migrate as follows:
    // $ truffle migrate --reset --compile-all
    //
    // db: {
        //   enabled: false,
        //   host: "127.0.0.1",
        //   adapter: {
            //     name: "indexeddb",
            //     settings: {
                //       directory: ".db"
                //     }
            //   }
        // }
};
