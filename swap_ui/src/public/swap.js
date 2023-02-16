import React, { useEffect, useState } from "react";
import Web3 from 'web3';
import * as ethers from "ethers";
import logo from './images/logo.png'; // Tell webpack this JS file uses this image
import swapsr from './images/swap_sr.svg'
import ETH from './images/ETH.svg'; // Tell webpack this JS file uses this image
import TextField from '@mui/material/TextField';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import {Pool,Route,Trade,SwapRouter} from '@uniswap/v3-sdk'
import {
  CurrencyAmount,
  Percent,
  TradeType,
} from '@uniswap/sdk-core'
import PulseLoader from "react-spinners/PulseLoader";
import {WETH,TEST_TOKEN, POOL_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS, SWAP_ROUTER_ADDRESS, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER, GET_ALLOWANCE_ABI, ERC20_ABI } from './constants'

export default function Swap() {
  const [account, setAccount] = useState();
  const [provider, setProvider] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signinData, setSigninData] = useState();
  const [walletProvider, setWalletProvider] = useState()
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState();
  const [selectedSendAmount, setSelectedSendAmount] = useState(0)
  const [selectedSendToken, setSelectedSendToken] = useState(WETH)
  const [selectedReceiveToken, setSelectedReceiveToken] = useState(TEST_TOKEN)
  const [selectedReceiveAmount, setSelectedReceiveAmount] = useState(0)
  const [balanceSend, setBalanceSend] = useState(0)
  const [balanceReceive, setBalanceReceive] = useState(0)

  function formatTokenDecimals(amount) {
    return `${Number(Math.floor(amount * 10000) / 10000)}`;
  }

  async function getAllowance() {
    try {
        const erc20Contract = new ethers.Contract(selectedSendToken.address, GET_ALLOWANCE_ABI, provider);
        const allowance = await erc20Contract.allowance(walletAddress, SWAP_ROUTER_ADDRESS);
        return Number(allowance)/(selectedSendToken.decimals);
    }
    catch (err) {
        console.error(err);
        return ethers.constants.Zero;
    }
}

  async function getTokenTransferApproval(
    token
  ) {
    const address = walletAddress
    if (!provider || !address) {
      console.log('No Provider Found')
      return
    }
  
    try {
      const tokenContract = new ethers.Contract(
        token.address,
        ERC20_ABI,
        provider
      )
  
      const transaction = await tokenContract.populateTransaction.approve(
        SWAP_ROUTER_ADDRESS,
        ethers.utils.parseUnits(TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER.toString(), selectedSendToken.decimals).toString()
      )
  
      const signer = provider.getSigner();
      const signature = await signer.sendTransaction(transaction);
      return signature
    } catch (e) {
      console.error(e)
      return
    }
  }

  const formatAccount = (str) => {
    if (str.length > 10) {
      const firstSix = str.substring(0, 6);
      const lastFour = str.substring(str.length - 4);
      return `${firstSix}...${lastFour}`;
    } else {
      return str;
    }
  }

  useEffect(() => {
    getFromCache('walletProvider', 'providerName').then(prov => {
      if(prov==="METAMASK"){
        console.log("WOOOHOOO")
        handleConnect()
      }
      else{
        console.log("NO WALLET")
      }
    })
  },[]);

  const getBalances = async(prov = provider , address = walletAddress) => {
    const contract_test = new ethers.Contract(TEST_TOKEN.address, ERC20_ABI, prov);
    const contract_weth = new ethers.Contract(WETH.address, ERC20_ABI, prov);
    const balanceTest= await contract_test.balanceOf(address)
    const balanceWETH = await contract_weth.balanceOf(address);
    if (selectedSendToken === WETH){
      setBalanceSend(balanceWETH/10**WETH.decimals)
      setBalanceReceive(balanceTest/10**TEST_TOKEN.decimals)
    }
    else{
      setBalanceReceive(balanceWETH/10**WETH.decimals)
      setBalanceSend(balanceTest/10**TEST_TOKEN.decimals)
    }
  }

  const addDataIntoCache = (cacheName, wallet, sig, sigData = false) => {
    const resp = new Response(sig)
    var isSame = false
    if ('caches' in window && (isSame || !sigData)) {
      // Opening given cache and putting our data into it
      caches.open(cacheName).then((cache) => {
        cache.put(wallet, resp);
      });
    }
  };

  const handleDisconnect = () =>{
    setIsConnected(false)
    setAccount(undefined)
    setBalanceSend(0)
    setBalanceReceive(0)
    setSelectedReceiveAmount(0)
    setSelectedSendAmount(0)
    addDataIntoCache('walletProvider', 'providerName', undefined)
  }
  

  const getFromCache = async(cacheName, wallet) => {
    if ('caches' in window) {
      const cache = await caches.open(cacheName)
      if(cache){
        const match = await cache.match(wallet)
        if(!match)return
        const sigText = await match.text()
        setSigninData(sigText)
        return sigText
      }
    }
  };

  const onMaxClick = () => {
    handleChangeSend(
      (formatTokenDecimals(balanceSend)).toString()
    );
  };
  
  const swapSendReceive = async () => {
    const newReceiveToken = selectedSendToken
    const newSendToken = selectedReceiveToken
    const newSendBalance = balanceReceive
    const newReceiveBalance = balanceSend
    setSelectedReceiveToken(newReceiveToken)
    setSelectedSendToken(newSendToken)
    setSelectedReceiveAmount(0)
    setSelectedSendAmount(0)
    setBalanceSend(newSendBalance)
    setBalanceReceive(newReceiveBalance)

  }

  const handleConnect = async () => {
    setWalletProvider("METAMASK")
    addDataIntoCache('walletProvider', 'providerName', "METAMASK")
    setIsLoading(true);
    
    if (window.ethereum) {
      await window.ethereum.enable();
    }
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(prov);
      const { chainId } = await prov.getNetwork()
      if ({chainId} !== "5"){ 
      window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
            chainId: "0x5",
            rpcUrls: ["https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
            chainName: "Goerli TestNet",
            nativeCurrency: {
                name: "WETH",
                symbol: "GETH",
                decimals: 18
            },
            blockExplorerUrls: ["https://goerli.etherscan.io"]
        }]
    });
      const signer = prov.getSigner();
      var address = await signer.getAddress();
      setWalletAddress(address)
      const ens = await prov.lookupAddress(Web3.utils.toChecksumAddress(address))
      setAccount(ens ?? formatAccount(address));
      
    } else {
      setIsLoading(false);
      throw new Error("MetaMask is not available");
    }
    setIsConnected(true)
    await getBalances(prov,address)
    setIsLoading(false);
  };

  const getQuote = async(amount) => {
    const sendToken = selectedSendToken
    const poolContract = new ethers.Contract(
      POOL_CONTRACT_ADDRESS,
      IUniswapV3PoolABI.abi,
      provider
    )
    const [token0, token1, fee] = await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
    ])
    const quoterContract = new ethers.Contract(
      QUOTER_CONTRACT_ADDRESS,
      Quoter.abi,
      provider
    )
    const quote = await quoterContract.callStatic.quoteExactInputSingle(
      sendToken === WETH ? token1 : token0,
      sendToken === WETH ? token0 : token1,
      fee,
      ethers.utils.parseUnits(amount.toString(), selectedSendToken.decimals).toString(),
      0
    )
    return quote
  }
  const handleChangeSend = async (amount) => {
    setSelectedSendAmount(amount)
    const sendToken = selectedSendToken
    if (!amount || parseFloat(amount) === 0.0){return}
    const quotedAmountOut = await getQuote(amount)
    setSelectedReceiveAmount(Number(quotedAmountOut)/10**selectedReceiveToken.decimals)
  };

  const handleSubmit = async () => {
    const token_in = selectedSendToken
    const token_out = selectedReceiveToken
    const poolContract = new ethers.Contract(
      POOL_CONTRACT_ADDRESS,
      IUniswapV3PoolABI.abi,
      provider
    )
    const [fee, liquidity, slot0] =
    await Promise.all([
      poolContract.fee(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])
    const pool = new Pool(
      token_in,
      token_out,
      fee,
      slot0[0].toString(),
      liquidity.toString(),
      slot0[1])
    const swapRoute = new Route(
      [pool],
      token_in,
      token_out
    )

    const amountOut = Number(await getQuote(selectedSendAmount))

    const uncheckedTrade = Trade.createUncheckedTrade({
      route: swapRoute,
      inputAmount: CurrencyAmount.fromRawAmount(
        token_in,
        ethers.utils.parseUnits(selectedSendAmount.toString(),selectedSendToken.decimals).toString()
      ),
      outputAmount: CurrencyAmount.fromRawAmount(
        token_out,
        amountOut
      ),
      tradeType: TradeType.EXACT_INPUT,
    })
    const options = {
      slippageTolerance: new Percent(500, 10000), // 50 bips, or 0.50%
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
      recipient: walletAddress,
    }
    const allowance = await getAllowance()
    if (allowance < selectedSendAmount){
       await getTokenTransferApproval(token_in)
    }
    const methodParameters = SwapRouter.swapCallParameters([uncheckedTrade], options)
    const tx = {
      data: methodParameters.calldata,
      to: SWAP_ROUTER_ADDRESS,
      value: methodParameters.value,
      from: walletAddress,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    }
    const signer = provider.getSigner()
    try{
      setIsSigning(true)
      const res = await signer.sendTransaction(tx)
      console.log(res)
    }
    catch(e){
      setIsSigning(false)
      throw new Error(e)
    }
    setIsSigning(false)
  }

  window.ethereum.on('connect', function (connectInfo) {
    getFromCache('walletProvider', 'providerName').then(prov => {
      console.log(prov)
      if(prov==="METAMASK"){
        handleConnect()
      }
    })
  })

  window.ethereum.on('accountsChanged', function (accounts) {
    getFromCache('walletProvider', 'providerName').then(prov => {
      console.log(prov)
      if(prov==="METAMASK"){
        handleConnect()
      }
    })
  })
 return (
    <div className="max-h-screen items-center">
      <header className="w-full py-2 flex items-center justify-between spacex-3 px-6 border-b-[1px] border-gray-600">
      <img
      src={logo}
      alt="Logo"
      className="h-24 w-32 rounded-xl"
    /> 
    {
            account ?
          <button
              className="bg-[#000000]	px-4 py-2 rounded-lg text-white border-[1px]"
              onClick={handleDisconnect}
            >
              <div className = "px-3 flex items-center space-x-3">
              <div className = "flex items-center space-x-1">
              <img src = {ETH} width = "25px" height = "25px"></img>
              <p>
              Ethereum
              </p>
              </div>
              <div className="button_glow border-[1px] border-gray-200">
      </div>
              <div>
              {account}
              </div>
      </div>
            </button>
:

        <button
          className="bg-[#BEE719]	px-4 py-2 rounded-lg font-semibold"
          onClick={handleConnect}
        >
          {"Connect Wallet"}
        </button>
}
      </header>

      <div className="flex-1 flex flex-col overflow-y-auto px-4 gap-4 my-2">
        <div className="flex justify-center items-center text-white relative mt-0.5" />
        <center>

        {isSigning ?            <div className = "flex mt-[40vh] justify-center items-center"><PulseLoader
        color={"#BEE719"}
        loading={true}
        size={25}
        aria-label="Loading Spinner"
        data-testid="loader"
      /> </div>:
        <div className="w-1/2 mt-4">
          <div className="">
            <div className="flex justify-between text-slate-400" />
            <div className="mt-2">
              <TextField
                type="tel"
                className="w-full"
                value={selectedSendAmount}
                sx={{
                  '& .MuiInputBase-input': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                  '& fieldset': {border: 'none'},
                  input: {marginLeft: '15px', fontSize: '20px'},
                  bgcolor: '#8F8F8F;',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                }}
                onChange={e => handleChangeSend(e.target.value)}
                InputProps={{
                  sx: {paddingRight: '8px', height: '100px'},
                  endAdornment: (
                    <div className="ml-2">
                      <div className="flex space-y-2">
                      {selectedSendToken.symbol}
                      </div>
                      
                        <div className="pt-2 text-sm">
                          <button
                            className="text-[#BEE719]"
                            onClick={() => onMaxClick()}
                          >
                            Balance:&nbsp;
                            {formatTokenDecimals(balanceSend)}
                          </button>
                        </div>

                      <div className="absolute left-[47.5%] mt-1 flex z-40 justify-center items-end">
                        <button onClick={swapSendReceive}>
                          <img className="h-[40px] w-[40px]" src={swapsr} />
                        </button>
                      </div>
                    </div>
                  ),
                }}
              />
            </div>
          </div>
          <div className="">
            <div className="">
              <TextField
                className="w-full"
                sx={{
                  '& .MuiInputBase-input': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                  '& fieldset': {border: 'none'},
                  input: {
                    marginLeft: '15px',
                    fontSize: '20px',
                  },
                  bgcolor: '#343434;',
                  borderBottomLeftRadius: '16px',
                  borderBottomRightRadius: '16px',
                }}
                type="tel"
                value={selectedReceiveAmount}
                onChange={e => setSelectedReceiveAmount(e.target.value)}
                InputProps={{
                  sx: {paddingRight: '8px', height: '100px'},
                  endAdornment: (
                    <div className="ml-2">
                            {selectedReceiveToken.symbol}
                            <div className="pt-2 text-sm">
                          <div
                            className="text-white"
                          >
                            Balance:&nbsp;
                            {formatTokenDecimals(balanceReceive)}
                          </div>
                        </div>
                    </div>
                  ),
                }}
                
              />
              
            </div>
          </div>
          
        </div>
}
        { isConnected && selectedSendAmount > 0 && !isSigning &&
        <button
          onClick = {handleSubmit}
          className="w-1/2 mt-6 bg-[#BEE719]	px-4 py-2 rounded-lg font-semibold"
        >
          {"Swap"}
        </button>
}
        </center>
    </div>

    </div>
  );

 }