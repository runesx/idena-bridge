const { getInstance } = require('./rclient');
const {
    setRunebaseEnv,
} = require('./rclientConfig');

export const startRunebaseEnv = async () => {
    await setRunebaseEnv('Mainnet', process.env.RUNEBASE_ENV_PATH);
    return;
}
export const isRunebaseConnected = async () => {
    const blockchainInfo = await getInstance().getBlockchainInfo();
    return;
}

const delay = ms => new Promise(res => setTimeout(res, ms));
//1. Create a new function that returns a promise
export const waitRunebaseNodeSync = async () => {    
    return new Promise(async (resolve, reject) => {
        let result = null;
        while (result >= 0.999) {
            const blockchainInfo = await getInstance().getBlockchainInfo();
            result= blockchainInfo.verificationprogress
            console.log('Node Sync value: ' + result)
            await delay(3000);
        }
        console.log('Runebase Node Fully Synced');
        resolve(true);
    });
  }

export const listTransactions = async (number) => {
    const transactions = await getInstance().listTransactions(number);
    return transactions;
}
