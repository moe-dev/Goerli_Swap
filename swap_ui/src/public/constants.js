import * as ethers from "ethers";
import {
    Token,
  } from '@uniswap/sdk-core'

export const WETH = new Token(
    5,
    '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    18,
    'WETH',
    'Wrapped Ether'
  );
export const TEST_TOKEN = new Token(
    5,
    '0x168dF3992A8f7d33559a79321Caccb1e6fd86e54',
    2,
    'TEST_TOKEN',
    'TEST_TOKEN'
  );
export const POOL_CONTRACT_ADDRESS = "0xEE42144D42F8905349036F14e419635De62488de"
export const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
export const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
export const MAX_FEE_PER_GAS = 100000000000
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 200000000
export const GET_ALLOWANCE_ABI = new ethers.utils.Interface([
    'function allowance(address owner, address spender) view returns (uint256)',
  ]);
export const ERC20_ABI = [
    // Read-Only Functions
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    // Authenticated Functions
    'function transfer(address to, uint amount) returns (bool)',
    'function approve(address _spender, uint256 _value) returns (bool)',
    // Events
    'event Transfer(address indexed from, address indexed to, uint amount)',
  ]