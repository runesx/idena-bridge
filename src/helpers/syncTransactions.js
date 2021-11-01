/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const BigNumber = require('bignumber.js');
const moment = require('moment');
const { Sequelize, Transaction, Op } = require('sequelize');
const db = require('../models');
const bsc = require('../bsc');
const logger = require('../logger').child({ component: "processing" });
const {
  // startRunebaseEnv,
  // waitRunebaseNodeSync,
  listTransactions,
  // listUnspent,
  sendToAddress,
} = require('../runebase/calls');

async function handleBscToRunebaseSwap(swap, logger, sockets) {
  console.log('handleBscToRunebaseSwap');

  const parsedAmount = Number(new BigNumber(swap.amount).div(1e8).times(1e18));
  const sendAmount = Number(new BigNumber(swap.amount).div(1e8));
  console.log(parsedAmount);

  if (!await bsc.isValidBurnTx(swap.transactions[0].bsc_tx, swap.depositAddress, parsedAmount, swap.time, swap.chainId)) {
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
  if (!await bsc.isTxConfirmed(swap.transactions[0].bsc_tx, swap.chainId)) {
    console.log('faiil');
    return;
  }
  console.log('before sending');
  console.log(sendAmount);
  console.log(swap.address);

  const hash = await sendToAddress(swap.address, sendAmount);
  console.log(hash);

  if (!hash) {
    // const reason = errorMessage ? errorMessage : 'Unknown';
    // logger.error(`Unable to send idena tx: ${reason}`);
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
    return;
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

  const updatedBridge = await db.bridges.findOne({
    where: {
      id: swap.id,
    },
  });
  const updatedTransactions = await db.transactions.findAll({
    order: [
      ['id', 'DESC'],
    ],
    include: [
      {
        where: {
          id: swap.id,
        },
        model: db.bridges,
        as: 'bridge',
        required: true,
      },
    ],
  });

  if (sockets[updatedBridge.uuid]) {
    sockets[updatedBridge.uuid].emit('updateBridge', {
      bridge: updatedBridge,
      transactions: updatedTransactions,
    });
  }
  console.log(finalizeTransaction);
}

async function handleSwap(swap, logger, sockets) {
  console.log('swap');
  const date = new Date(swap.time);
  date.setDate(date.getDate() + 1);

  if (swap.type === 1 && swap.transactions[0].bsc_tx && moment(date).unix() > moment(Date.now()).unix()) {
    console.log('WRUNES TO RUNES');
    await handleBscToRunebaseSwap(swap, logger, sockets);
    return;
  }

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
    // await conP.execute("UPDATE `swaps` SET `status` = 'Fail' , `mined` = '2' ,`fail_reason` = 'Time' WHERE `uuid` = ?", [swap.uuid])
  }
  logger.trace("Swap skipped");
}

export async function checkSwaps(io, sockets) {
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
    for (const swap of pending) {
      const swapLogger = logger.child({ swapId: swap.uuid });
      try {
        console.log('before handleswap');
        await handleSwap(swap, swapLogger, sockets);
      } catch (error) {
        swapLogger.error(`Failed to handle swap: ${error}`);
      }
    }

    t.afterCommit(() => {
      // next();
    });
  }).catch((err) => {
    console.log(err.message);
    logger.error(`Failed to load pending swaps: ${err.message}`);
  });
}

export async function patchRunebaseTransactions(io, sockets) {
  const transactions = await listTransactions(100);
  if (transactions) {
    // eslint-disable-next-line no-restricted-syntax
    for (const transaction of transactions) {
      if (transaction.category === "receive") {
        if (transaction.address) {
          // console.log(transaction);
          const bridge = await db.bridges.findOne({
            where: {
              depositAddress: transaction.address,
              status: 'pending',
            },
          });
          if (!bridge) {
            console.log('bridge not found');
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
              if (transaction.amount > Number(process.env.RUNEBASE_MIN_SWAP)) {
                const amounte = new BigNumber(transaction.amount).times(1e8);

                // console.log(transaction);
                const newTransaction = await db.transactions.create({
                  runebase_tx: transaction.txid,
                  confirmations: transaction.confirmations,
                  amount: Math.trunc(amounte),
                  collectedRunebaseFee: parseInt(process.env.RUNEBASE_FIXED_FEE, 10),
                  bridgeId: bridge.id,
                  from: transaction.from,
                });

                const updatedBridge = await db.bridges.findOne({
                  where: {
                    id: bridge.id,
                  },
                });
                const updatedTransactions = await db.transactions.findAll({
                  order: [
                    ['id', 'DESC'],
                  ],
                  include: [
                    {
                      where: {
                        id: bridge.id,
                      },
                      model: db.bridges,
                      as: 'bridge',
                      required: true,
                    },
                  ],
                });

                if (sockets[updatedBridge.uuid]) {
                  sockets[updatedBridge.uuid].emit('updateBridge', {
                    bridge: updatedBridge,
                    transactions: updatedTransactions,
                  });
                }
              }
            } else if (!dbTransaction.minted && dbTransaction.confirmations >= 6) {
              // Mint Tokens
              if (
                dbTransaction.bridge.chainId === parseInt(process.env.BSC_NETWORK, 10)
                  || dbTransaction.bridge.chainId === parseInt(process.env.MATIC_NETWORK, 10)
              ) {
                const {
                  hash,
                  fees,
                } = await bsc.mint(dbTransaction.bridge.address, (dbTransaction.amount / 1e8), dbTransaction.bridge.chainId);
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
                  const updatedBridge = await db.bridges.findOne({
                    where: {
                      id: dbTransaction.bridgeId,
                    },
                  });
                  const updatedTransactions = await db.transactions.findAll({
                    order: [
                      ['id', 'DESC'],
                    ],
                    include: [
                      {
                        where: {
                          id: dbTransaction.bridgeId,
                        },
                        model: db.bridges,
                        as: 'bridge',
                        required: true,
                      },
                    ],
                  });

                  if (sockets[updatedBridge.uuid]) {
                    sockets[updatedBridge.uuid].emit('updateBridge', {
                      bridge: updatedBridge,
                      transactions: updatedTransactions,
                    });
                  }
                }
              }
            } else if (!dbTransaction.minted && dbTransaction.confirmations < 6) {
              await db.sequelize.transaction({
                isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
              }, async (t) => {
                const updateTransaction = await dbTransaction.update({
                  confirmations: transaction.confirmations,
                });
                t.afterCommit(() => {
                  // next();
                });
              }).catch((err) => {
                console.log(err.message);
                logger.error(`Failed to load pending swaps: ${err.message}`);
              });
              const updatedBridge = await db.bridges.findOne({
                where: {
                  id: dbTransaction.bridgeId,
                },
              });
              const updatedTransactions = await db.transactions.findAll({
                order: [
                  ['id', 'DESC'],
                ],
                include: [
                  {
                    where: {
                      id: dbTransaction.bridgeId,
                    },
                    model: db.bridges,
                    as: 'bridge',
                    required: true,
                  },
                ],
              });

              if (sockets[updatedBridge.uuid]) {
                sockets[updatedBridge.uuid].emit('updateBridge', {
                  bridge: updatedBridge,
                  transactions: updatedTransactions,
                });
              }
            }
          }
        }
      }
    }
  }
}
