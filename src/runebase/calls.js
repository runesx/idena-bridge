const { getInstance } = require('./rclient');
const {
  setRunebaseEnv,
} = require('./rclientConfig');

export const startRunebaseEnv = async () => {
  await setRunebaseEnv('Mainnet', process.env.RUNEBASE_ENV_PATH);
};
export const isRunebaseConnected = async () => {
  const blockchainInfo = await getInstance().getBlockchainInfo();
  return blockchainInfo;
};

export const listUnspentForAddress = async () => {
  const blockchainInfo = await getInstance().listUnspent();
  return blockchainInfo;
};

export const listUnspent = async () => {
  const unspent = await getInstance().listUnspent();
  return unspent;
};

export const sendToAddress = async (address, amount, comment = '', commentTo = '', subtractFeeFromAmount = false) => {
  console.log('senttoaddress;');
  console.log(address);
  console.log(amount);

  const unspent = await getInstance().sendToAddress(address, amount, comment, commentTo, subtractFeeFromAmount);
  console.log(unspent);
  return unspent;
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
// 1. Create a new function that returns a promise
export const waitRunebaseNodeSync = async () => new Promise(async (resolve, reject) => {
  let result = null;
  while (result >= 0.999) {
    const blockchainInfo = await getInstance().getBlockchainInfo();
    result = blockchainInfo.verificationprogress;
    console.log(`Node Sync value: ${result}`);
    await delay(3000);
  }
  console.log('Runebase Node Fully Synced');
  resolve(true);
});

export const listTransactions = async (number) => {
  const transactions = await getInstance().listTransactions(number);
  return transactions;
};

export const isRunebaseAddress = async (address) => {
  console.log('address');
  console.log(address);
  try {
    const addressX = await getInstance().isRunebaseAddress(address);
    return addressX;
  } catch (e) {
    console.log(e);
  }
};

export const getNewAddress = async () => {
  const address = await getInstance().getNewAddress();
  return address;
};
