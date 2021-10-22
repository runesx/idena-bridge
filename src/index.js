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
} = require('./runebase/calls');

const {
    consolidate,
} = require('./runebase/consolidate');


async function handleBscToRunebaseSwap(swap, logger) {
    console.log('handleBscToRunebaseSwap');
    if (!await bsc.isValidBurnTx(swap.transactions[0].bsc_tx, swap.address, swap.amount, swap.time)) {
        // not valid
        logger.info("BSC tx is invalid");
        console.log("BSC tx is invalid");
        await conP.execute("UPDATE `swaps` SET `status` = 'Fail' , `mined` = '2' , `fail_reason` = 'Not Valid' WHERE `uuid` = ?", [swap.uuid])
    }
    if (!await bsc.isNewTx(swap.transactions[0].bsc_tx)) {
        // not new
        logger.info("BSC tx already used");
        console.log("BSC tx already used");
        await conP.execute("UPDATE `swaps` SET `status` = 'Fail' , `mined` = '2' , `fail_reason` = 'Not Valid' WHERE `uuid` = ?", [swap.uuid])
    }
    if (!await bsc.isTxConfirmed(swap.transactions[0].bsc_tx)) {
        // waiting to be confirmed
        logger.debug("BSC tx is not confirmed");
        console.log("BSC tx is not confirmed");
        await conP.execute("UPDATE `swaps` SET `mined` = '0' WHERE `uuid` = ?", [swap.uuid])
    }
    // confirmed
    const [data2] = await conP.execute("INSERT INTO `used_txs`(`blockchain`,`tx_hash`) VALUES ('bsc',?);", [swap.bsc_tx]);
    if (!data2.insertId) {
        logger.error("Unable to insert used BSC tx")
        return
    }
    let {
        hash,
        fees,
        errorMessage
    } = await idena.send(swap.address, swap.amount);
    if (!hash) {
        const reason = errorMessage ? errorMessage : 'Unknown'
        logger.error(`Unable to send idena tx: ${reason}`)
        await conP.execute("UPDATE `swaps` SET `status` = 'Fail' ,`mined` = '1' ,`fail_reason` = ? WHERE `uuid` = ?", [reason, swap.uuid])
        return
    }
    logger.info(`Swap completed, idena tx hash: ${hash}`)
    await conP.execute("UPDATE `swaps` SET `status` = 'Success' ,`mined` = '1' ,`idena_tx` = ? , `fees` = ? WHERE `uuid` = ?", [hash, fees, swap.uuid])
}

async function handleSwap(swap, logger) {
    console.log(swap);

    if (swap.type === 1 && swap.bsc_tx) {
        console.log('WRUNES TO RUNES');
        await handleBscToRunebaseSwap(swap, logger)
        return
    }

    let date = new Date(swap.time);
    date.setDate(date.getDate() + 1);
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
        const pending = await db.instances.findAll({
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

async function loopCheckSwaps() {
    //console.log('loopcheckswapsstart');
    await checkSwaps();
    setTimeout(loopCheckSwaps, parseInt(process.env.CHECKING_DELAY));
}

async function patchRunebaseTransactions() {
    const transactions = await listTransactions(100);
    if (transactions) {
        for (const transaction of transactions) {
            if (transaction.category === "receive") {
                if (transaction.address) {
                    //console.log(transaction);
                    const instance = await db.instances.findOne({
                        where: {
                            depositAddress: transaction.address,
                            status: 'pending',
                        },               
                    });                
                    if (!instance) {
                        //console.log('not found');
                    } else {
                        const dbTransaction = await db.transactions.findOne({
                            where: {
                                runebase_tx: transaction.txid,
                            },
                            include: [
                                {
                                  model: db.instances,
                                  as: 'instance',
                                },
                              ],
                        });
                        
                        if (!dbTransaction) {
                            if (transaction.amount > 3) {
                                console.log(transaction);
                                const newTransaction = await db.transactions.create({
                                    runebase_tx: transaction.txid,
                                    confirmations: transaction.confirmations,
                                    amount: transaction.amount * 1e8,
                                    collectedRunebaseFee: parseInt(process.env.RUNEBASE_FIXED_FEE),
                                    instanceId: instance.id,
                                    from: transaction.from,
                                });
                            }                            
                        } else if (!dbTransaction.minted && dbTransaction.confirmations >= 6) {
                            // Mint Tokens                            
                            let {
                                hash,
                                fees
                            } = await bsc.mint(dbTransaction.instance.address, (dbTransaction.amount / 1e8));
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