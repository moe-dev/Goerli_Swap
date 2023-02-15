require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
// Any file that has require('dotenv').config() statement 
// will automatically load any variables in the root's .env file.
require('dotenv').config();
 
module.exports = {
  solidity: "0.4.24",
  networks:{
    goerli:{
      // Ankr's Public RPC URL
      url: "https://rpc.ankr.com/eth_goerli",
     // PRIVATE_KEY loaded from .env file
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  }
};