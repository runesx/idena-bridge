const express = require('express'),
    app = express(),
    mysql = require('mysql2'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    idena = require('./idena'),
    bsc = require('./bsc');
    const db = require('./models');
    const { Sequelize, Transaction, Op } = require('sequelize');
const logger = require('./logger').child({component: "processing"})
const swaps = require('./routes/swaps');
const {
    startRunebaseEnv,
    waitRunebaseNodeSync,
    listTransactions,
    listUnspent,
    sendToAddress,
} = require('./runebase/calls');
const {
    formatUnits,
    parseUnits,    
} = require("@ethersproject/units");

const {
    consolidate,
} = require('./runebase/consolidate');
const BigNumber = require('bignumber.js');


async function handleBscToRunebaseSwap(swap, logger) {
    console.log('handleBscToRunebaseSwap');
    console.log('swap amount');   
    console.log(swap.amount); 
    
    const parsedAmount = Number(new BigNumber(swap.amount).div(1e8).times(1e18));
    console.log(parsedAmount);
    

    if (!await bsc.isValidBurnTx(swap.transactions[0].bsc_tx, swap.depositAddress, parsedAmount, swap.time)) {
        // not valid
        logger.info("BSC tx is invalid");
        console.log("BSC tx is invalid");
        await swap.update({
            status: 'Fail',
            mined: 2,
            fail_reason: 'Not Valid',
        });
        await swap.transaction[0].update({
            minted: true,
            fail_reason: 'Not Valid',
        });
    }
    console.log('handleBscToRunebaseSwap 1');
    if (!await bsc.isNewTx(swap.transactions[0].bsc_tx)) {
        // not new
        logger.info("BSC tx already used");
        console.log("BSC tx already used");
        await swap.update({
            status: 'Fail',
            mined: 2,
            fail_reason: 'Not Valid',
        });
        await swap.transaction[0].update({
            minted: true,
            fail_reason: 'Not Valid',
        });
    }
    console.log('handleBscToRunebaseSwap 2');
    if (!await bsc.isTxConfirmed(swap.transactions[0].bsc_tx)) {
        return;
    }
    console.log('before sending');    

    const hash = await sendToAddress(swap.address, parsedAmount);
    console.log(hash);
 
    if (!hash) {
        //const reason = errorMessage ? errorMessage : 'Unknown';
        //logger.error(`Unable to send idena tx: ${reason}`);
        console.log(`Unable to send runebase tx`);
        await swap.update({
            status: 'Fail',
            mined: 1,
            fail_reason: 'Unknown',
        });
        await swap.transaction[0].update({
            minted: true,
            fail_reason: 'Unknown',
        });
        return
    }
    logger.info(`Swap completed, runebase tx hash: ${hash}`);
    console.log(`Swap completed, runebase tx hash: ${hash}`);
    const updateswap = await swap.update({
        status: 'Success',
        mined: 1,
    });
    console.log(updateswap);

    const finalizeTransaction = await swap.transaction[0].update({
        minted: true,
        runebase_tx: hash,
    });
    console.log(finalizeTransaction);
}

async function handleSwap(swap, logger) {
    console.log('swap');
    let date = new Date(swap.time);
    date.setDate(date.getDate() + 1);
    console.log('handleswap');
    console.log(swap.type);
    console.log(swap.transactions);
    console.log(swap.time);
    console.log(date);
    console.log(Date.now());
    if (swap.type === 1 && swap.transactions[0].bsc_tx && date > Date.now()) {
        console.log('WRUNES TO RUNES');
        await handleBscToRunebaseSwap(swap, logger)
        return
    }
    console.log('fail');
    console.log(swap.type);
    console.log(swap.transactions[0].bsc_tx);

    
    if (date < Date.now()) {
        logger.info("Swap is outdated");
        await swap.update({
            mined: 2,
            status: 'Fail',
            fail_reason: 'Time',
        });
        
        await swap.transactions[0].update({
            minted: true,
            fail_reason: 'Time',
        });
        //await conP.execute("UPDATE `swaps` SET `status` = 'Fail' , `mined` = '2' ,`fail_reason` = 'Time' WHERE `uuid` = ?", [swap.uuid])
    }
    logger.trace("Swap skipped")
}

async function checkSwaps() {
    await db.sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      }, async (t) => {
          console.log('checkswaps');
        const pending = await db.bridges.findAll({
            where: {
              status: 'pending',
              type: 1,
            },
            include: [
                {
                  model: db.transactions,
                  as: 'transactions',
                },
              ],
          });
        if (!pending.length) {
            return;
        }
        for (let swap of pending) {
            const swapLogger = logger.child({swapId: swap.uuid})
            try {
                console.log('before handleswap');
                await handleSwap(swap, swapLogger)
            } catch (error) {
                swapLogger.error(`Failed to handle swap: ${error}`);
            }
        }

        t.afterCommit(() => {
          //next();
        });
      }).catch((err) => {
        console.log(err.message);
        logger.error(`Failed to load pending swaps: ${err.message}`);
      });
}



async function patchRunebaseTransactions() {
    const transactions = await listTransactions(100);
    if (transactions) {
        for (const transaction of transactions) {
            if (transaction.category === "receive") {
                if (transaction.address) {
                    //console.log(transaction);
                    const bridge = await db.bridges.findOne({
                        where: {
                            depositAddress: transaction.address,
                            status: 'pending',
                        },               
                    });                
                    if (!bridge) {
                        //console.log('not found');
                    } else {
                        const dbTransaction = await db.transactions.findOne({
                            where: {
                                runebase_tx: transaction.txid,
                            },
                            include: [
                                {
                                  model: db.bridges,
                                  as: 'bridge',
                                },
                              ],
                        });
                        
                        if (!dbTransaction) {
                            if (transaction.amount > 100) {
                                const amounte = new BigNumber(transaction.amount).times(1e8);

                                //console.log(transaction);
                                const newTransaction = await db.transactions.create({
                                    runebase_tx: transaction.txid,
                                    confirmations: transaction.confirmations,
                                    amount: Math.trunc(amounte),
                                    collectedRunebaseFee: parseInt(process.env.RUNEBASE_FIXED_FEE),
                                    bridgeId: bridge.id,
                                    from: transaction.from,
                                });
                            }                            
                        } else if (!dbTransaction.minted && dbTransaction.confirmations >= 6) {
                            // Mint Tokens                            
                            let {
                                hash,
                                fees
                            } = await bsc.mint(dbTransaction.bridge.address, (dbTransaction.amount / 1e8));
                            if (!hash) {
                                logger.log("Unable to mint bsc coins");
                                logger.error("Unable to mint bsc coins");
                                const updateTransaction = await dbTransaction.update({
                                    confirmations: transaction.confirmations,
                                    fail_reason: 'bsc.mint function failed',
                                    minted: true,
                                });
                            }
                            if (hash) {
                                await db.sequelize.transaction({
                                    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
                                }, async (t) => {
                                    
                                    const updateTransaction = await dbTransaction.update({
                                        confirmations: transaction.confirmations,
                                        bsc_tx: hash,
                                        minted: true,
                                        spendBscFee: fees,
                                    }, {
                                        transaction: t,
                                    });
                                    t.afterCommit(() => {
                                        console.log(`Swap completed, bsc tx hash: ${hash}, fees: ${fees}`);
                                        console.info(`Swap completed, bsc tx hash: ${hash}, fees: ${fees}`);
                                    });
                                }).catch((err) => {
                                    console.log(err.message);
                                    logger.error(`Failed to load pending swaps: ${err.message}`);
                                });                          
                                
                            } 
                        } else if (!dbTransaction.minted && dbTransaction.confirmations < 6) {
                            await db.sequelize.transaction({
                                isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
                            }, async (t) => {
                                const updateTransaction = await dbTransaction.update({
                                    confirmations: transaction.confirmations,
                                });
                                t.afterCommit(() => {
                                //next();
                                });
                            }).catch((err) => {
                                console.log(err.message);
                                logger.error(`Failed to load pending swaps: ${err.message}`);
                            });
                        }                        
                    } 
                }
            }                         
        }
    }    
}

async function loopRunebaseTransactions() {
    await patchRunebaseTransactions();
    setTimeout(loopRunebaseTransactions, parseInt(process.env.CHECKING_DELAY));
}

async function consolidateRunebase() {    
    const consolidateNow = await consolidate();
    return;
}

async function loopConsolidateRunebase() {
    //console.log('loopcheckswapsstart');
    await consolidateRunebase();
    setTimeout(loopConsolidateRunebase, parseInt(process.env.CHECKING_DELAY));
}

async function loopCheckSwaps() {
    //console.log('loopcheckswapsstart');
    await checkSwaps();
    setTimeout(loopCheckSwaps, parseInt(process.env.CHECKING_DELAY));
}

app.use(cors())
app.use(bodyParser.json());
app.use('/', swaps);

async function start() {
    await startRunebaseEnv();
    await waitRunebaseNodeSync();
    loopCheckSwaps();
    loopRunebaseTransactions();
    loopConsolidateRunebase();
    const port = 8000;
    app.listen(port, () => console.log(`Server started, listening on port: ${port}`));
}

start()