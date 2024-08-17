require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545", // Your Ganache RPC Server address
      accounts: ["0x76ebf82f7ef31f8c38cae7a6bb2e1335903fae3bd9d85c24187e12c40c667381"] // Private key of an account provided by Ganache
    }
    // You can add other network configurations here
  },
};
