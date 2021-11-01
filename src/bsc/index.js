const {
  default: axios,
} = require('axios');
const ethers = require('ethers');
const InputDataDecoder = require('ethereum-input-data-decoder');
const abiDecoder = require('abi-decoder');
const abi = require('./abi');
const db = require('../models');
require('dotenv').config();
const logger = require('../logger').child({
  component: "bsc",
});

abiDecoder.addABI(abi);

exports.mint = async function (address, amount, network) {
  let rpcUrl = '';
  let myContract = '';
  if (network === parseInt(process.env.BSC_NETWORK, 10)) {
    console.log('its a binance transaction');
    rpcUrl = process.env.BSC_RPC;
    myContract = process.env.BSC_CONTRACT;
  }
  if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
    console.log('its a matic transaction');
    rpcUrl = process.env.MATIC_RPC;
    myContract = process.env.MATIC_CONTRACT;
  }
  console.log('rpcUrl');
  console.log(rpcUrl);
  console.log(myContract);

  // const networkId = '';
  console.log('checkpoint1');
  try {
    const newAmount = ethers.utils.parseEther((parseFloat(amount)).toString());
    console.log(rpcUrl);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
    const signer = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, provider);
    console.log('before contract');
    const contract = new ethers.Contract(
      myContract,
      abi,
      signer,
    );
    console.log(address);
    console.log(newAmount);
    console.log(newAmount.toString());
    // console.log(contract);
    console.log('before minting');
    const minted = await contract.mint(address, newAmount);
    console.log(minted);
    console.log('checkpoint2');
    // let fees = ethers.utils.parseUnits((await provider.getGasPrice() * await contract.estimateGas.mint(address, amount) / idenaPrice).toString(), 'ether').div(ethers.BigNumber.from(100)).mul(ethers.BigNumber.from(process.env.BSC_FEES));
    return {
      hash: minted.hash,
      fees: 100, // parseFloat(fees / 10 ** 18)
    };
  } catch (error) {
    console.log(`Failed to mint: ${error}`);
    logger.error(`Failed to mint: ${error}`);
    return null;
  }
};

exports.isValidBurnTx = async function (txHash, address, amount, date, network) {
  function extractDestAddress(inputData) {
    try {
      if (!inputData) {
        return false;
      }
      const inputDataDecoder = new InputDataDecoder(abi);
      const result = inputDataDecoder.decodeData(inputData);
      if (!result || !result.inputs || result.inputs.length < 2) {
        return false;
      }
      return result.inputs[1];
    } catch (error) {
      logger.error(`Failed to extract dest address: ${error}`);
      return false;
    }
  }
  try {
    let rpcUrl = '';
    let myContract = '';
    if (network === parseInt(process.env.BSC_NETWORK, 10)) {
      rpcUrl = process.env.BSC_RPC;
      myContract = process.env.BSC_CONTRACT;
    }
    if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
      rpcUrl = process.env.MATIC_RPC;
      myContract = process.env.MATIC_CONTRACT;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
    const contract = new ethers.Contract(
      myContract,
      abi,
    );

    const txReceipt = await provider.getTransactionReceipt(txHash);
    console.log(txReceipt);
    console.log('wtf');

    if (txReceipt.status !== 1) {
      logger.info(`Wrong status, actual: ${txReceipt.status}, expected: 1`);
      console.log(`Wrong status, actual: ${txReceipt.status}, expected: 1`);
      return false;
    }
    if (txReceipt.logs.length === 0) {
      logger.info(`No logs`);
      console.log(`No logs`);
      return false;
    }
    if (txReceipt.to.toLowerCase() !== myContract.toLowerCase()) {
      logger.info(`Wrong recipient, actual: ${txReceipt.to}, expected: ${myContract}`);
      console.log(`Wrong recipient, actual: ${txReceipt.to}, expected: ${myContract}`);
      return false;
    }
    const tx = await provider.getTransaction(txHash);
    const destAddress = tx && extractDestAddress(tx.data);
    if (destAddress.toLowerCase() !== address.toLowerCase().slice(2)) {
      logger.info(`Wrong dest address, actual: ${destAddress}, expected: ${address}`);
      console.log(`Wrong dest address, actual: ${destAddress}, expected: ${address}`);
      return false;
    }
    const method = contract.interface.parseLog(txReceipt.logs[0]).name;
    if (method !== "Transfer") {
      logger.info(`Wrong method, actual: ${method}, expected: Transfer`);
      console.log(`Wrong method, actual: ${method}, expected: Transfer`);
      return false;
    }
    const { value } = contract.interface.parseLog(txReceipt.logs[0]).args;
    console.log('value');
    console.log(value);
    console.log(amount);
    console.log(ethers.utils.parseEther(amount.toString()));
    console.log('numbemr Values');
    console.log(Number(value));
    console.log(Number(amount));
    // console.log(Number(ethers.utils.parseEther(amount.toString())));
    if (!(value >= amount)) {
      logger.info(`Wrong value, actual: ${value}, expected: at least ${amount}`);
      console.log(`Wrong value, actual: ${value}, expected: at least ${amount}`);
      return false;
    }
    const { from } = contract.interface.parseLog(txReceipt.logs[0]).args;
    if (from.toLowerCase() !== tx.from.toLowerCase()) {
      logger.info(`Wrong sender, actual: ${from}, expected: ${tx.from}`);
      console.log(`Wrong sender, actual: ${from}, expected: ${tx.from}`);
      return false;
    }
    const { to } = contract.interface.parseLog(txReceipt.logs[0]).args;
    if (to.toLowerCase() !== "0x0000000000000000000000000000000000000000") {
      logger.info(`Wrong recipient, actual: ${to}, expected: 0x0000000000000000000000000000000000000000`);
      console.log(`Wrong recipient, actual: ${to}, expected: 0x0000000000000000000000000000000000000000`);
      return false;
    }
    const block = await provider.getBlock(tx.blockHash);
    const blockDate = new Date(block.timestamp * 1000);
    if (blockDate.getTime() < date.getTime()) {
      logger.info("Tx is not actual");
      console.log("Tx is not actual");
      return false;
    }
    return true;
  } catch (error) {
    logger.error(`Failed to check if burn tx is valid: ${error}`);
    return false;
  }
};

exports.isTxExist = async function (txHash, network) {
  try {
    let rpcUrl = '';
    if (network === parseInt(process.env.BSC_NETWORK, 10)) {
      rpcUrl = process.env.BSC_RPC;
    }
    if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
      rpcUrl = process.env.MATIC_RPC;
    }

    console.log(process.env.BSC_RPC);
    console.log(process.env.BSC_NETWORK);
    console.log(txHash);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
    const tx = await provider.getTransactionReceipt(txHash);
    console.log('isTxExist tx');
    console.log(tx);
    if (tx) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to check if tx exists: ${error}`);
    return false;
  }
};
exports.isTxConfirmed = async function (txHash, network) {
  try {
    let rpcUrl = '';
    if (network === parseInt(process.env.BSC_NETWORK, 10)) {
      rpcUrl = process.env.BSC_RPC;
    }
    if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
      rpcUrl = process.env.MATIC_RPC;
    }
    console.log('isTxConfirmed');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
    const tx = await provider.getTransactionReceipt(txHash);
    if (tx) {
      return tx.confirmations >= process.env.BSC_CONFIRMATIONS_BLOCKS;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to check if tx is confirmed: ${error}`);
    return false;
  }
};
exports.getWalletAddress = async function () {
  const signer = new ethers.Wallet(process.env.BSC_PRIVATE_KEY);
  return await signer.getAddress();
};
exports.getContractAddress = function () {
  return process.env.BSC_CONTRACT;
};

async function getIdenaPrice() {
  const resp = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=idena&vs_currencies=bnb");
  if (resp.status === 200 && resp.data.idena.bnb) {
    return ethers.utils.parseEther(resp.data.idena.bnb.toString());
  }
  return 0;
}

exports.isNewTx = async function (tx) {
  console.log('isnewtx');
  console.log(tx);
  try {
    const transaction = await db.transactions.findOne({
      where: {
        bsc_tx: tx.toString(),
        minted: true,
      },
    });
    console.log(transaction);
    if (transaction) {
      console.log('transaction found');
      return false;
    }
    if (!transaction) {
      console.log('transaction not found');
      return true;
    }
  } catch (error) {
    logger.error(`Failed to check if tx is new: ${error}`);
    console.log(`Failed to check if tx is new: ${error}`);
    return false;
  }
};

exports.calculateFees = async function (address, amount) {
  try {
    amount = ethers.utils.parseEther((parseFloat(amount)).toString());
    const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC, parseInt(process.env.BSC_NETWORK));
    const signer = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.BSC_CONTRACT,
      abi,
      signer,
    );
    const idenaPrice = await getIdenaPrice();
    if (idenaPrice == 0) {
      return null;
    }
    const fees = ethers.utils.parseUnits((await provider.getGasPrice() * await contract.estimateGas.mint(address, amount) / idenaPrice).toString(), 'ether').div(ethers.BigNumber.from(100)).mul(ethers.BigNumber.from(process.env.BSC_FEES));
    return parseFloat(fees / 10 ** 18);
  } catch (error) {
    logger.error(`Failed to calculate fees: ${error}`);
    return null;
  }
};
