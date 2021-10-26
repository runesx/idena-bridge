const express = require('express'),
    router = express.Router();
const uuid = require('uuid');
const db = require('../models');
    const { Sequelize, Transaction, Op } = require('sequelize');
    import walletNotify from '../controllers/walletNotify';
const bsc = require('../bsc');
const {
    utils
} = require('ethers');
const {
    ethers
} = require('ethers');
const logger = require('../logger').child({
    component: "api"
});
const {
    startRunebaseEnv,
    waitRunebaseNodeSync,
    getNewAddress,
    isRunebaseAddress,
    isRunebaseConnected,
} = require('../runebase/calls');
const BigNumber = require('bignumber.js');

router.post('/api/rpc/walletnotify',
    walletNotify,
    (req, res) => {
      console.log('afterWalletNotify');
      if (res.locals.error) {
        console.log(res.locals.error);
      } else if (!res.locals.error && res.locals.transaction) {
        if (res.locals.activity) {
          if (onlineUsers[res.locals.userId.toString()]) {
            onlineUsers[res.locals.userId.toString()].emit('insertTransaction', { transaction: res.locals.transaction });
          }
          io.emit('Activity', res.locals.activity);
        }
        console.log('end insert');
      }
    }); // IMPORTANT: Make sure this endpoint is only accessible by Runebase Node

router.get('/latest', async function (req, res) {
    try {
        console.log('latest');
        await latest(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function latest(req, res) {
    const reqInfo = req.path
    logger.debug(`Got ${reqInfo}`);
    const result = await db.bridges.findAll({
        where: {
          userId: req.user.id,
        },
        limit: 50,
        order: [['time', 'DESC']],
        attributes: [
            'address',
            'depositAddress',
            'type',
            'amount',
            'status',
            'time',
        ],
      });
    if (result.length) {
        logger.debug(`Completed ${reqInfo}`)
        res.status(200).json({
            result,
        });
        return;
    }
    res.sendStatus(500);
    return;
}

router.get('/info/:uuid', async function (req, res) {
    //console.log(req);
    try {
        await info(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function info(req, res) {
    const reqInfo = req.path
    logger.debug(`Got ${reqInfo}`);
    console.log('infocalled');
    //console.log(req.params);
    if (!uuid.validate(req.params.uuid)) {
        logger.debug(`Bad request ${reqInfo}`)
        res.sendStatus(400);
        return
    }
    const bridge = await db.bridges.findOne({
        where: {
            uuid: req.params.uuid,
        },
    });
    const transactions = await db.transactions.findAll({
        order: [
            ['id', 'DESC'],
        ],
        include: [
            {
              where: {
                uuid: req.params.uuid,
              },
              model: db.bridges,
              as: 'bridge',                 
              required: true,
            },
          ],
    });
    console.log(bridge);
    if (!bridge || !transactions) {
        logger.debug(`Not found ${reqInfo}`)
        res.sendStatus(404);
                return;
    }
    if (bridge && transactions) {
        logger.debug(`Completed ${reqInfo}`)
        res.status(200).json({
            bridge,
            transactions,
        })
    }
}

router.get('/transactions', async function (req, res) {    
    try {
        await fetchTransactions(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function fetchTransactions(req, res) {
    const result = await db.transactions.findAll({
        order: [
            ['id', 'DESC'],
        ],
        include: [
            {
              model: db.bridges,
              as: 'bridge',              
            },
          ],
    })
    if (!result) {
        logger.debug(`Not found`);
        res.sendStatus(404);
                return;
    }
    if (result) {
        logger.debug(`Completed`);
        console.log(`Completed`);
        res.status(200).json({result})
    }
}

router.post('/assign', async function (req, res) {
    console.log('route /assign');
    try {
        await assign(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path} (uuid=${req.body.uuid}): ${error}`)
        res.sendStatus(500)
    }
});

async function assign(req, res) {
    console.log('start assign function');
    const reqInfo = `${req.path} (uuid=${req.body.uuid}, tx=${req.body.tx})`
    logger.debug(`Got ${reqInfo}`)
    if (!uuid.validate(req.body.uuid)) {
        console.log('uid not valid');
        logger.debug(`Bad request ${reqInfo}`)
        res.sendStatus(400);
        return
    }

    function reject(err) {
        console.log('rejected');
        logger.error(`Failed ${reqInfo}: ${err}`)
        res.sendStatus(500);
    }
    
    const bridge = await db.bridges.findOne({
        where: {
            uuid: req.body.uuid,
        },
        include: [
            {
              model: db.transactions,
              as: 'transactions',
              required: false,
            },
          ],
    });
    //console.log(bridge);

    if (bridge) {
        console.log('found bridge');        
    } else {
        console.log('unable to find bridge');
        logger.debug(`unable to find bridge ${reqInfo}`)
        res.sendStatus(400);
        return
    }

    //console.log(req.body);
    console.log(req.body.txid.length);
    console.log(bridge.type);
    console.log(bridge.transactions);
    console.log(ethers.utils.isHexString(req.body.txid) );
    console.log(req.body.txid.length);
    console.log(bridge.transactions.length);
    

    if 
    (
        bridge 
        && bridge.type === 1 
        && bridge.transactions.length < 1 
        && ethers.utils.isHexString(req.body.txid) 
        && req.body.txid.length === 66
    ) 
    {
        console.log('888');
        if (await bsc.isTxExist(req.body.txid)) {
            console.log('999');
            const actualAmount = new BigNumber(bridge.amount).div(1e8).times(1e18);
            console.log(actualAmount);
            if (
                await bsc.isValidBurnTx(
                    req.body.txid, 
                    bridge.depositAddress, 
                    actualAmount, 
                    bridge.time
                ) 
                && await bsc.isNewTx(req.body.txid)
                ) 
                {
                    console.log('insert new transaction');
                    const newTransaction = await db.transactions.create({
                    bridgeId: bridge.id,
                    bsc_tx: req.body.txid,
                    amount: bridge.amount,
                    });
                    console.log(newTransaction);
                    if (newTransaction) {
                        logger.debug(`Completed ${reqInfo}`);
                        console.log(`Completed ${reqInfo}`);
                        res.sendStatus(200);
                    }
                    if (!newTransaction) {
                        logger.debug(`Bad request ${reqInfo}`)
                        res.sendStatus(400);
                        return
                    }                
                }

        }
    }
}

router.post('/create', async function (req, res) {
    //console.log(req.body);
    try {
        console.log('create');
        await create(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path} (type=${req.body.type}, amount=${req.body.amount}, address=${req.body.address}): ${error}`)
        res.sendStatus(500)
    }
});





async function create(req, res) {
    const isItConnected = await isRunebaseConnected();
    console.log(isItConnected);
    if(!isItConnected) {
        console.log(`Unable to connect to Runebase Node`);
        logger.debug(`Unable to connect to Runebase Node`);
        res.sendStatus(400);
        return;
    }
    console.log('after is it connected');
    const reqInfo = `${req.path} (type=${req.body.type}, address=${req.body.destinationAddress})`;
    console.log(reqInfo);
    logger.debug(`Got ${reqInfo}`);
    //console.log('type:');
    let type = parseInt(req.body.type);
    //console.log(type);
    let amount = parseFloat(req.body.amount);
    let RunebaseAddress;
    if(isNaN(amount)){
        console.log(`Amount is not a number ${reqInfo}`);
        logger.debug(`Amount is not a number ${reqInfo}`);
        res.status(500).send({
            error: 'Amount is not a number',
          });
        return;
    }

    if (type === 0 ) { // destination already exist
        const existDestination = await db.bridges.findOne({
            where: {
                address:  req.body.destinationAddress, //destination address
            },
        });
        if (existDestination) {
            res.status(200).json({
                result: {
                    "uuid": existDestination.uuid,
                }
            });
            return;
        }
    }
    
    console.log('not exist');

    if (type === 0) {
        RunebaseAddress = await getNewAddress();
        console.log(RunebaseAddress);
    }

    if (type === 0 && !RunebaseAddress) {
        console.log(`Unable to generate Runebase Address ${reqInfo}`);
        logger.debug(`Unable to generate Runebase Address  ${reqInfo}`);
        res.status(500).send({
            error: 'Unable to generate Runebase Address',
          });
        return;
    }

    if (!isRunebaseAddress(req.body.destinationAddress) && type === 1) {
        console.log(`Invalid Runebase Address ${reqInfo}`);
        logger.debug(`Invalid Runebase Address ${reqInfo}`);
        res.status(500).send({
            error: 'Invalid Runebase Address',
          });
        return;
    }
    console.log('check1');
    console.log(req.body.destinationAddress);
    console.log(type);

    if (!utils.isAddress(req.body.destinationAddress) && type === 0) {
        console.log(`Invalid BSC Address ${reqInfo}`);
        logger.debug(`Invalid BSC Address ${reqInfo}`);
        res.status(500).send({
            error: 'Invalid BSC Address',
          });
        return;
    }

    if (type !== 0 && (type !== 1)) {
        console.log('Invalid Type');
        logger.debug(`Invalid Type ${reqInfo}`)
        res.status(500).send({
            error: 'Invalid Type',
          });
        return
    }

    //if (type === 0 && (amount <= process.env.MIN_SWAP)) {
    //    console.log('bad request');
    //    logger.debug(`Bad request ${reqInfo}`)
    //    res.status(500).send({
    //        error: 'Invalid Amount',
    //      });
    //    return
    // }

    if (type === 1 && (amount <= 100)) {
        console.log('bad request');
        logger.debug(`Bad request ${reqInfo}`)
        res.status(500).send({
            error: 'Invalid Amount',
          });
        return
    }

    console.log(req.body);
    

    console.log('insert swap');
    const amounte = new BigNumber(amount).times(1e8);
    console.log(Number(amounte.toFixed(0)));
    console.log(Math.trunc(amounte));
    let newUUID = uuid.v4();
    await db.sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      }, async (t) => {
          //console.log(parseUnits(amount, 18));
        const activity = await db.bridges.create({
            uuid: newUUID,
            amount: Math.trunc(amounte),
            address: req.body.destinationAddress,
            depositAddress: type === 0 && RunebaseAddress ? RunebaseAddress : req.body.address,
            type,
          }, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          console.log(activity);
        t.afterCommit(() => {
            logger.debug(`Completed ${reqInfo}: ${newUUID}`)
            res.status(200).json({
                result: {
                    "uuid": newUUID,
                }
            });
        });
      }).catch((err) => {
        console.log(`Failed to handle request '/create': ${err.message}`)
        logger.error(`Failed to handle request '/create': ${err.message}`)
        res.sendStatus(500);
        return;
      });
}

router.get('/calculateFees/:uuid', async function (req, res) {
    try {
        await calculateFees(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function calculateFees(req, res) {
    const reqInfo = req.path
    logger.debug(`Got ${reqInfo}`)
    if (!uuid.validate(req.params.uuid)) {
        logger.debug(`Bad request ${reqInfo}`)
        res.sendStatus(400);
        return
    }
    let sql = "SELECT address, amount FROM `swaps` WHERE `uuid` = ? LIMIT 1;";
    db.promise().execute(sql, [req.params.uuid])
        .then(async ([data, fields]) => {
            if (!data[0]) {
                logger.debug(`Not found ${reqInfo}`)
                res.sendStatus(404);
                return
            }
            logger.debug(`Completed ${reqInfo}`)

            res.status(200).json({
                result: await bsc.calculateFees(data[0].address, data[0].amount)
            })
        })
        .catch(err => {
            logger.error(`Failed ${reqInfo}: ${err}`)
            res.sendStatus(500);
        });
}

module.exports = router;